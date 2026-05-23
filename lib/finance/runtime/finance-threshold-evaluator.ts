/**
 * P6.1 — Évaluation seuils KPI trésorerie → bus finance.threshold.exceeded.
 */

import { emitFinanceThresholdExceeded } from "@/lib/erp-core/events/integrations/finance-events";
import {
  FINANCE_TREASURY_THRESHOLD_RULES,
  type FinanceTreasuryThresholdRule,
} from "@/lib/finance/runtime/finance-threshold-rules";

/** Entrée minimale KPI — évite import finance-overview → expenses (Vitest). */
export type FinanceThresholdTreasuryInput = {
  expensesMonth: number;
  expensesToday: number;
  profitMonth: number;
  netRevenueMonth: number;
};

const KPI_SOURCE = "finance-treasury-runtime-v1" as const;

export const FINANCE_THRESHOLD_EVALUATOR_VERSION = "finance-threshold-evaluator-p6-1-v1" as const;

/** Anti-spam émission (cockpit / API dept refresh). */
const EMISSION_COOLDOWN_MS = 5 * 60 * 1000;
const lastEmittedAt = new Map<string, number>();

export function resolveTreasuryMetricValue(
  treasury: FinanceThresholdTreasuryInput,
  metric: FinanceTreasuryThresholdRule["metric"],
): number {
  switch (metric) {
    case "expensesMonth":
      return treasury.expensesMonth;
    case "expensesToday":
      return treasury.expensesToday;
    case "profitMonth":
      return treasury.profitMonth;
    case "netRevenueMonth":
      return treasury.netRevenueMonth;
    default:
      return 0;
  }
}

export function isFinanceThresholdExceeded(
  rule: FinanceTreasuryThresholdRule,
  treasury: FinanceThresholdTreasuryInput,
): boolean {
  const actual = resolveTreasuryMetricValue(treasury, rule.metric);
  if (rule.compare === "above") {
    return actual > rule.thresholdGnf;
  }
  return actual < rule.thresholdGnf;
}

export function isFinanceThresholdEmissionCooldownActive(thresholdKey: string): boolean {
  const until = lastEmittedAt.get(thresholdKey);
  if (until == null) return false;
  return Date.now() < until;
}

export function markFinanceThresholdEmitted(thresholdKey: string): void {
  lastEmittedAt.set(thresholdKey, Date.now() + EMISSION_COOLDOWN_MS);
}

export function clearFinanceThresholdEmissionCooldownForTests(): void {
  lastEmittedAt.clear();
}

export type EvaluateFinanceThresholdsResult = {
  evaluated: number;
  emitted: string[];
  skippedCooldown: string[];
};

/**
 * Évalue les seuils et publie les événements officiels (bus → bridge P5 → automation P6).
 * Ne bloque pas le runtime lecture — appeler en fire-and-forget depuis KPI bundle.
 */
export async function evaluateAndEmitFinanceTreasuryThresholds(
  treasury: FinanceThresholdTreasuryInput,
  ctx: { actorUserId: string },
): Promise<EvaluateFinanceThresholdsResult> {
  const emitted: string[] = [];
  const skippedCooldown: string[] = [];

  for (const rule of FINANCE_TREASURY_THRESHOLD_RULES) {
    if (!rule.enabled) continue;
    if (!isFinanceThresholdExceeded(rule, treasury)) continue;

    if (isFinanceThresholdEmissionCooldownActive(rule.key)) {
      skippedCooldown.push(rule.key);
      continue;
    }

    const actualGnf = resolveTreasuryMetricValue(treasury, rule.metric);

    await emitFinanceThresholdExceeded({
      actorUserId: ctx.actorUserId,
      thresholdKey: rule.key,
      thresholdGnf: rule.thresholdGnf,
      actualGnf,
      period: rule.period,
      kpiSource: KPI_SOURCE,
    });

    markFinanceThresholdEmitted(rule.key);
    emitted.push(rule.key);
  }

  return {
    evaluated: FINANCE_TREASURY_THRESHOLD_RULES.filter((r) => r.enabled).length,
    emitted,
    skippedCooldown,
  };
}
