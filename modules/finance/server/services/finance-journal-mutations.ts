/**
 * Bloc 3 — Mutations journal gouvernées : approval → post → bus → audit.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  assertFinanceWriteActionAllowed,
  FINANCE_WRITE_ACTIONS,
} from "@/lib/finance/runtime/finance-write-governance";
import {
  emitFinanceApprovalApproved,
  emitFinanceApprovalRejected,
  emitFinanceApprovalRequested,
  emitFinanceTransactionFailed,
} from "@/lib/erp-core/events/integrations/finance-events";
import { FINANCE_APPROVAL_ENTITY_TYPES } from "@/modules/finance/constants/approval-entities";
import { recordFinanceGovernanceAudit } from "@/modules/finance/server/services/finance-audit-hook";
import { emitFinanceTransactionForJournalBatch } from "@/modules/finance/server/services/finance-transaction-mutations";

export async function submitFinanceJournalBatchApproval(
  userId: string,
  input: { batchId: string; reason: string },
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await assertFinanceWriteActionAllowed(userId, FINANCE_WRITE_ACTIONS.JOURNAL_SUBMIT_APPROVAL, "update");
  } catch {
    return { success: false, error: "Action non autorisee." };
  }

  const batchId = String(input.batchId ?? "").trim();
  const reason = String(input.reason ?? "").trim();
  if (!batchId || reason.length < 8) {
    return { success: false, error: "Lot ou motif invalide." };
  }

  const supabase = getSupabaseServerClient();
  const { data: batch } = await supabase
    .from("finance_journal_batches")
    .select("id,status,approval_request_id")
    .eq("id", batchId)
    .maybeSingle();

  if (!batch || batch.status !== "draft") {
    return { success: false, error: "Seuls les lots brouillon peuvent etre soumis." };
  }

  const approvalInsert = await supabase.from("approval_requests").insert({
    department_key: "finance",
    action_type: "finance_journal_post",
    entity_type: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
    entity_id: batchId,
    requested_by: userId,
    reason,
    payload_snapshot: { batch_id: batchId },
  });

  if (approvalInsert.error) {
    return { success: false, error: "Impossible de creer la demande d'approbation." };
  }

  const { data: approval } = await supabase
    .from("approval_requests")
    .select("id")
    .eq("entity_id", batchId)
    .eq("entity_type", FINANCE_APPROVAL_ENTITY_TYPES.journalBatch)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (approval?.id) {
    await supabase
      .from("finance_journal_batches")
      .update({ approval_request_id: approval.id })
      .eq("id", batchId);
  }

  await Promise.all([
    emitFinanceApprovalRequested({
      actorUserId: userId,
      entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
      entityId: batchId,
      approvalRequestId: approval?.id ?? batchId,
      reason,
    }),
    recordFinanceGovernanceAudit({
      actionType: FINANCE_WRITE_ACTIONS.JOURNAL_SUBMIT_APPROVAL,
      entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
      entityId: batchId,
      afterSnapshot: { approval_request_id: approval?.id ?? null, status: "draft" },
    }),
  ]);

  return { success: true };
}

export async function postFinanceJournalBatch(
  userId: string,
  batchId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const id = String(batchId ?? "").trim();
  if (!id) return { success: false, error: "Lot invalide." };

  const supabase = getSupabaseServerClient();
  const { data: batch } = await supabase
    .from("finance_journal_batches")
    .select("id,status,approval_request_id")
    .eq("id", id)
    .maybeSingle();

  if (!batch) return { success: false, error: "Lot introuvable." };
  if (batch.status !== "draft") {
    return { success: false, error: "Ce lot a deja ete comptabilise." };
  }

  try {
    await assertFinanceWriteActionAllowed(userId, FINANCE_WRITE_ACTIONS.JOURNAL_POST, "update");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action non autorisee.";
    await emitFinanceTransactionFailed({
      actorUserId: userId,
      entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
      entityId: id,
      reason: message,
    });
    return { success: false, error: "Action non autorisee." };
  }

  const { error: rpcError } = await supabase.rpc("post_finance_journal_batch", {
    p_batch_id: id,
  });

  if (rpcError) {
    await emitFinanceTransactionFailed({
      actorUserId: userId,
      entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
      entityId: id,
      reason: rpcError.message,
    });
    return { success: false, error: rpcError.message };
  }

  if (batch.approval_request_id) {
    await supabase
      .from("approval_requests")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", batch.approval_request_id);
  }

  await Promise.all([
    emitFinanceApprovalApproved({
      actorUserId: userId,
      entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
      entityId: id,
      approvalRequestId: batch.approval_request_id,
    }),
    emitFinanceTransactionForJournalBatch(userId, id),
    recordFinanceGovernanceAudit({
      actionType: FINANCE_WRITE_ACTIONS.JOURNAL_POST,
      entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
      entityId: id,
      beforeSnapshot: { status: "draft" },
      afterSnapshot: { status: "posted" },
    }),
  ]);

  return { success: true };
}

export async function rejectFinanceJournalBatchApproval(
  userId: string,
  input: { batchId: string; rejectionReason?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const batchId = String(input.batchId ?? "").trim();
  if (!batchId) return { success: false, error: "Lot invalide." };

  const supabase = getSupabaseServerClient();
  const { data: batch } = await supabase
    .from("finance_journal_batches")
    .select("id,status,approval_request_id")
    .eq("id", batchId)
    .maybeSingle();

  if (!batch?.approval_request_id) {
    return { success: false, error: "Aucune demande d'approbation liee." };
  }

  await supabase
    .from("approval_requests")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: String(input.rejectionReason ?? "").trim() || null,
    })
    .eq("id", batch.approval_request_id);

  await Promise.all([
    emitFinanceApprovalRejected({
      actorUserId: userId,
      entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
      entityId: batchId,
      rejectionReason: input.rejectionReason ?? null,
    }),
    recordFinanceGovernanceAudit({
      actionType: FINANCE_WRITE_ACTIONS.JOURNAL_POST,
      entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
      entityId: batchId,
      afterSnapshot: { approval_status: "rejected" },
    }),
  ]);

  return { success: true };
}
