import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/types/database.types";
import type { Json } from "@/types/database.types";
import type {
  ApprovalDecisionInput,
  ApprovalRequestStatus,
  GovernanceApprovalRequest,
} from "@/lib/governance/approvals/types";

type ApprovalRow = Database["public"]["Tables"]["approval_requests"]["Row"];

function toModel(row: ApprovalRow): GovernanceApprovalRequest {
  return {
    id: row.id,
    departmentKey: row.department_key,
    actionType: row.action_type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    payloadSnapshot:
      row.payload_snapshot && typeof row.payload_snapshot === "object"
        ? (row.payload_snapshot as Record<string, unknown>)
        : {},
    reason: row.reason,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
  };
}

export async function createApprovalRequest(input: {
  departmentKey: string;
  actionType: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
  reason?: string | null;
  payloadSnapshot?: Record<string, unknown>;
}): Promise<GovernanceApprovalRequest> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("approval_requests")
    .insert({
      department_key: input.departmentKey,
      action_type: input.actionType,
      entity_type: input.entityType,
      entity_id: input.entityId,
      requested_by: input.requestedBy,
      reason: input.reason ?? null,
      payload_snapshot: (input.payloadSnapshot ?? {}) as Json,
      status: "pending",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Impossible de creer la demande d'approbation: ${error?.message ?? "unknown"}`);
  }
  return toModel(data);
}

export async function listApprovalRequests(filters?: {
  status?: ApprovalRequestStatus;
  departmentKey?: string;
  actionType?: string;
  limit?: number;
}): Promise<GovernanceApprovalRequest[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("approval_requests")
    .select("*")
    .order("requested_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(filters?.limit ?? 100);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.departmentKey) query = query.eq("department_key", filters.departmentKey);
  if (filters?.actionType) query = query.eq("action_type", filters.actionType);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Impossible de lister les approbations: ${error.message}`);
  }
  return (data ?? []).map(toModel);
}

export async function getActiveApprovalForAction(input: {
  departmentKey: string;
  actionType: string;
  entityType: string;
  entityId: string;
  requestedBy: string;
}): Promise<GovernanceApprovalRequest | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("department_key", input.departmentKey)
    .eq("action_type", input.actionType)
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId)
    .eq("requested_by", input.requestedBy)
    .in("status", ["pending", "approved"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`Impossible de verifier les approbations existantes: ${error.message}`);
  }
  return data ? toModel(data) : null;
}

export async function decideApprovalRequest(input: ApprovalDecisionInput): Promise<void> {
  const supabase = getSupabaseServerClient();
  const patch: Database["public"]["Tables"]["approval_requests"]["Update"] = {
    status: input.status,
  };
  if (input.status === "approved") {
    patch.approved_by = input.approverUserId;
    patch.approved_at = new Date().toISOString();
    patch.rejection_reason = null;
    patch.rejected_at = null;
  } else {
    patch.approved_by = null;
    patch.approved_at = null;
    patch.rejected_at = new Date().toISOString();
    patch.rejection_reason = input.rejectionReason ?? null;
  }
  const { error } = await supabase.from("approval_requests").update(patch).eq("id", input.requestId);
  if (error) {
    throw new Error(`Impossible d'appliquer la decision d'approbation: ${error.message}`);
  }
}
