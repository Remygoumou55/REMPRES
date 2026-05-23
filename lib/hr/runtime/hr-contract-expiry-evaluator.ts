/**
 * P7.3 — Évaluation échéances contrats → bus hr.contract.expiring.
 */

import { emitHrContractExpiring } from "@/lib/erp-core/events/integrations/hr-events";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { shouldMarkRenewalDue } from "@/modules/hr/contracts/utils";
import {
  HR_CONTRACT_DEFAULT_RENEWAL_WINDOW_DAYS,
  HR_CONTRACT_EXPIRY_ELIGIBLE_STATUSES,
} from "@/lib/hr/runtime/hr-contract-expiry-rules";

export const HR_CONTRACT_EXPIRY_EVALUATOR_VERSION = "hr-contract-expiry-evaluator-p7-3-v1" as const;

/** Acteur système lorsque le snapshot est chargé sans session (cron / background). */
export const HR_CONTRACT_EXPIRY_SYSTEM_ACTOR_ID = "erp-system-rh-contract-evaluator" as const;

/** Anti-spam par contrat (refresh cockpit / snapshot). */
const DEFAULT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const lastEmittedAt = new Map<string, number>();

export type HrContractExpiryInput = {
  id: string;
  employeeId: string;
  endDate: string | null;
  renewalWindowDays: number | null;
  status: string;
};

export function computeDaysUntilExpiry(endDate: string, now = new Date()): number {
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export function resolveRenewalWindowDays(value: number | null | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return HR_CONTRACT_DEFAULT_RENEWAL_WINDOW_DAYS;
  return Math.floor(n);
}

export function isHrContractExpiryCandidate(contract: HrContractExpiryInput): boolean {
  if (!contract.endDate?.trim()) return false;
  if (!HR_CONTRACT_EXPIRY_ELIGIBLE_STATUSES.includes(contract.status as (typeof HR_CONTRACT_EXPIRY_ELIGIBLE_STATUSES)[number])) {
    return false;
  }
  if (contract.status === "renewal_due") return true;
  const windowDays = resolveRenewalWindowDays(contract.renewalWindowDays);
  return shouldMarkRenewalDue(contract.endDate, windowDays);
}

export function isHrContractExpiryEmissionCooldownActive(contractId: string): boolean {
  const until = lastEmittedAt.get(contractId);
  if (until == null) return false;
  return Date.now() < until;
}

export function markHrContractExpiryEmitted(contractId: string, cooldownMs = DEFAULT_COOLDOWN_MS): void {
  lastEmittedAt.set(contractId, Date.now() + cooldownMs);
}

export function clearHrContractExpiryEmissionCooldownForTests(): void {
  lastEmittedAt.clear();
}

export type EvaluateHrContractExpiryResult = {
  evaluated: number;
  emitted: string[];
  skippedCooldown: string[];
  skippedIneligible: number;
};

/**
 * Publie hr.contract.expiring pour contrats dans la fenêtre (bus → bridge P7.2 → automation P7.3).
 */
export async function resolveHrContractExpiryActorUserId(
  explicitActorUserId?: string | null,
): Promise<string> {
  if (explicitActorUserId?.trim()) return explicitActorUserId.trim();
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user?.id) return data.user.id;
  } catch {
    /* hors request Next — fallback système */
  }
  return HR_CONTRACT_EXPIRY_SYSTEM_ACTOR_ID;
}

export async function evaluateAndEmitHrContractExpiringEvents(
  contracts: readonly HrContractExpiryInput[],
  ctx?: { actorUserId?: string | null },
): Promise<EvaluateHrContractExpiryResult> {
  const actorUserId = await resolveHrContractExpiryActorUserId(ctx?.actorUserId);
  const result: EvaluateHrContractExpiryResult = {
    evaluated: contracts.length,
    emitted: [],
    skippedCooldown: [],
    skippedIneligible: 0,
  };

  for (const contract of contracts) {
    if (!isHrContractExpiryCandidate(contract)) {
      result.skippedIneligible += 1;
      continue;
    }
    if (!contract.endDate) continue;

    if (isHrContractExpiryEmissionCooldownActive(contract.id)) {
      result.skippedCooldown.push(contract.id);
      continue;
    }

    const daysUntilExpiry = computeDaysUntilExpiry(contract.endDate);
    await emitHrContractExpiring({
      actorUserId,
      contractId: contract.id,
      employeeId: contract.employeeId,
      endDate: contract.endDate,
      daysUntilExpiry,
    });
    markHrContractExpiryEmitted(contract.id);
    result.emitted.push(contract.id);
  }

  return result;
}
