/**
 * P9 — Mutations cycle de vie contrat : gate → write → publisher → audit.
 */

import type { Json } from "@/types/database.types";
import { createApprovalRequest } from "@/lib/governance/approvals/repository";
import {
  emitHrContractExpired,
  emitHrContractRenewed,
  emitHrContractSubmitted,
  emitHrContractTerminated,
  emitHrContractExpiring,
} from "@/lib/erp-core/events/integrations/hr-events";
import {
  assertHrWriteActionAllowed,
  HR_WRITE_ACTIONS,
} from "@/lib/hr/runtime/hr-write-governance";
import { computeDaysUntilExpiry } from "@/lib/hr/runtime/hr-contract-expiry-evaluator";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isValidContractStatus } from "@/modules/hr/contracts/server/validators/contract";
import { recordHrGovernanceAudit } from "@/modules/hr/server/services/hr-audit-hook";

const RH_CONTRACT_ENTITY = "rh_contract";
const APPROVAL_ACTION = "rh_contract_activation";

async function logRhContractActivity(input: {
  actorId: string;
  actionKey: string;
  contractId: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServerClient();
  await supabase.from("activity_logs").insert({
    actor_user_id: input.actorId,
    module_key: "rh",
    action_key: input.actionKey,
    target_table: "rh_employee_contracts",
    target_id: input.contractId,
    metadata: (input.metadata ?? {}) as Json,
  });
}

export async function submitHrContractForApproval(
  userId: string,
  input: { contractId: string; reason?: string },
): Promise<
  { success: true; approvalRequestId: string } | { success: false; error: string }
> {
  const contractId = String(input.contractId ?? "").trim();
  if (!contractId) return { success: false, error: "Contrat invalide." };

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.CONTRACT_SUBMIT_APPROVAL, "update", {
      entityType: RH_CONTRACT_ENTITY,
      entityId: contractId,
      reason: input.reason,
    });
  } catch {
    return { success: false, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const existing = await supabase
    .from("rh_employee_contracts")
    .select("id,status,employee_id,contract_type,start_date,end_date,approval_request_id")
    .eq("id", contractId)
    .maybeSingle();
  if (existing.error || !existing.data) return { success: false, error: "Contrat introuvable." };
  if (existing.data.status !== "draft") {
    return { success: false, error: "Seuls les contrats en brouillon peuvent etre soumis." };
  }

  const pendingDup = await supabase
    .from("approval_requests")
    .select("id")
    .eq("entity_type", RH_CONTRACT_ENTITY)
    .eq("entity_id", contractId)
    .eq("status", "pending")
    .maybeSingle();
  if (pendingDup.data?.id) {
    return { success: false, error: "Une demande d'approbation est deja en cours pour ce contrat." };
  }

  let approvalId: string;
  try {
    const approval = await createApprovalRequest({
      departmentKey: "rh",
      actionType: APPROVAL_ACTION,
      entityType: RH_CONTRACT_ENTITY,
      entityId: contractId,
      requestedBy: userId,
      reason: String(input.reason ?? "").trim() || null,
      payloadSnapshot: {
        contract_id: contractId,
        employee_id: existing.data.employee_id,
        contract_type: existing.data.contract_type,
        start_date: existing.data.start_date,
        end_date: existing.data.end_date,
      },
    });
    approvalId = approval.id;
  } catch {
    return { success: false, error: "Impossible de creer la demande d'approbation." };
  }

  const updated = await supabase
    .from("rh_employee_contracts")
    .update({ status: "pending_approval", approval_request_id: approvalId, updated_by: userId })
    .eq("id", contractId)
    .eq("status", "draft");
  if (updated.error) {
    await supabase.from("approval_requests").delete().eq("id", approvalId);
    return { success: false, error: "Mise a jour du contrat impossible." };
  }

  await supabase.from("rh_contract_history").insert({
    contract_id: contractId,
    event_type: "submitted_for_approval",
    event_label: "Contrat soumis pour approbation gouvernance",
    payload: { approval_request_id: approvalId },
    created_by: userId,
  });

  await Promise.all([
    emitHrContractSubmitted({
      actorUserId: userId,
      contractId,
      employeeId: existing.data.employee_id,
      approvalRequestId: approvalId,
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.CONTRACT_SUBMIT_APPROVAL,
      entityType: RH_CONTRACT_ENTITY,
      entityId: contractId,
      afterSnapshot: { status: "pending_approval", approval_request_id: approvalId },
    }),
    logRhContractActivity({
      actorId: userId,
      actionKey: "contract_submitted_for_approval",
      contractId,
      metadata: { approval_request_id: approvalId },
    }),
  ]);

  return { success: true, approvalRequestId: approvalId };
}

export async function transitionHrContractStatus(
  userId: string,
  input: { contractId: string; status: string; reason?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const nextStatus = String(input.status ?? "").trim().toLowerCase();
  if (!isValidContractStatus(nextStatus)) return { success: false, error: "Statut invalide." };

  const contractId = String(input.contractId ?? "").trim();
  if (!contractId) return { success: false, error: "Contrat invalide." };

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.CONTRACT_STATUS_UPDATE, "update", {
      entityType: RH_CONTRACT_ENTITY,
      entityId: contractId,
      reason: input.reason,
    });
  } catch {
    return { success: false, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const row = await supabase
    .from("rh_employee_contracts")
    .select("status,employee_id,end_date")
    .eq("id", contractId)
    .maybeSingle();
  if (row.error || !row.data) return { success: false, error: "Contrat introuvable." };

  const previousStatus = row.data.status;

  if (nextStatus === "active") {
    if (previousStatus === "draft" || previousStatus === "pending_approval") {
      return {
        success: false,
        error: "Activation reservee apres approbation gouvernance.",
      };
    }
  }

  const update = await supabase
    .from("rh_employee_contracts")
    .update({ status: nextStatus, updated_by: userId })
    .eq("id", contractId);
  if (update.error) return { success: false, error: "Transition statut impossible." };

  await supabase.from("rh_contract_history").insert({
    contract_id: contractId,
    event_type: "status_changed",
    event_label: `Statut contrat : ${nextStatus}`,
    payload: { reason: input.reason ?? null, previous_status: previousStatus },
    created_by: userId,
  });

  const publishTasks: Promise<unknown>[] = [
    logRhContractActivity({
      actorId: userId,
      actionKey: `contract_status_${nextStatus}`,
      contractId,
      metadata: { status: nextStatus, previous_status: previousStatus },
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.CONTRACT_STATUS_UPDATE,
      entityType: RH_CONTRACT_ENTITY,
      entityId: contractId,
      afterSnapshot: { status: nextStatus, previous_status: previousStatus },
    }),
  ];

  if (nextStatus === "renewal_due" && row.data.end_date && row.data.employee_id) {
    publishTasks.push(
      emitHrContractExpiring({
        actorUserId: userId,
        contractId,
        employeeId: row.data.employee_id,
        endDate: row.data.end_date,
        daysUntilExpiry: computeDaysUntilExpiry(row.data.end_date),
      }).catch((err) => {
        console.warn(
          "[hr-contract-expiring:transition]",
          err instanceof Error ? err.message : err,
        );
      }),
    );
  }

  if (nextStatus === "expired" && row.data.employee_id) {
    publishTasks.push(
      emitHrContractExpired({
        actorUserId: userId,
        contractId,
        employeeId: row.data.employee_id,
        previousStatus,
      }),
    );
  }

  if (nextStatus === "terminated" && row.data.employee_id) {
    publishTasks.push(
      emitHrContractTerminated({
        actorUserId: userId,
        contractId,
        employeeId: row.data.employee_id,
        previousStatus,
        reason: input.reason,
      }),
    );
  }

  await Promise.all(publishTasks);
  return { success: true };
}

export async function renewHrContract(
  userId: string,
  input: { contractId: string; newEndDate: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const contractId = String(input.contractId ?? "").trim();
  const newEndDate = String(input.newEndDate ?? "").trim();
  if (!contractId || !newEndDate) return { success: false, error: "Dates invalides." };

  try {
    await assertHrWriteActionAllowed(userId, HR_WRITE_ACTIONS.CONTRACT_RENEW, "update", {
      entityType: RH_CONTRACT_ENTITY,
      entityId: contractId,
    });
  } catch {
    return { success: false, error: "Action reservee aux gestionnaires RH." };
  }

  const supabase = getSupabaseServerClient();
  const existing = await supabase
    .from("rh_employee_contracts")
    .select("id,start_date,end_date,status,employee_id")
    .eq("id", contractId)
    .maybeSingle();
  if (existing.error || !existing.data) return { success: false, error: "Contrat introuvable." };
  if (existing.data.start_date > newEndDate) {
    return { success: false, error: "La nouvelle date de fin doit etre apres la date de debut." };
  }

  const previousEndDate = existing.data.end_date;
  const employeeId = existing.data.employee_id;

  const updated = await supabase
    .from("rh_employee_contracts")
    .update({ end_date: newEndDate, status: "active", updated_by: userId })
    .eq("id", contractId);
  if (updated.error) return { success: false, error: "Renouvellement impossible." };

  await supabase.from("rh_contract_history").insert({
    contract_id: contractId,
    event_type: "renewed",
    event_label: "Contrat renouvele (nouvelle date de fin)",
    payload: { previous_end_date: previousEndDate, new_end_date: newEndDate },
    created_by: userId,
  });

  await Promise.all([
    emitHrContractRenewed({
      actorUserId: userId,
      contractId,
      employeeId,
      previousEndDate,
      newEndDate,
    }),
    recordHrGovernanceAudit({
      actionType: HR_WRITE_ACTIONS.CONTRACT_RENEW,
      entityType: RH_CONTRACT_ENTITY,
      entityId: contractId,
      afterSnapshot: { end_date: newEndDate, status: "active" },
    }),
    logRhContractActivity({
      actorId: userId,
      actionKey: "contract_renewed",
      contractId,
      metadata: { new_end_date: newEndDate },
    }),
  ]);

  return { success: true };
}
