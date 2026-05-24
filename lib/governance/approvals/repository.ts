import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { logError } from "@/lib/logger";
import type { Database } from "@/types/database.types";
import type { Json } from "@/types/database.types";
import type {
  ApprovalDecisionInput,
  ApprovalRequestStatus,
  GovernanceApprovalRequest,
} from "@/lib/governance/approvals/types";

type ApprovalRow = Database["public"]["Tables"]["approval_requests"]["Row"];

type ApprovalRowLike = ApprovalRow & {
  module?: string | null;
  target_id?: string | null;
  requester_dept?: string | null;
  description?: string | null;
  action_payload?: Json | null;
  deleted_at?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asText(value: unknown, fallback = "unknown"): string {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeApprovalStatus(value: unknown): ApprovalRequestStatus {
  const status = String(value ?? "pending").trim().toLowerCase();
  if (status === "approved" || status === "rejected" || status === "expired") {
    return status;
  }
  return "pending";
}

function toModel(row: ApprovalRowLike): GovernanceApprovalRequest {
  const payloadSnapshot = asRecord(row.payload_snapshot ?? row.action_payload);
  const createdAt = row.created_at ?? row.requested_at ?? new Date().toISOString();

  return {
    id: row.id,
    departmentKey: asText(row.department_key ?? row.requester_dept ?? row.module),
    actionType: asText(row.action_type),
    entityType: asText(row.entity_type ?? row.module),
    entityId: asText(row.entity_id ?? row.target_id),
    requestedBy: asText(row.requested_by, "unknown"),
    requestedAt: row.requested_at ?? createdAt,
    payloadSnapshot,
    reason: row.reason ?? row.description ?? null,
    status: normalizeApprovalStatus(row.status),
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    createdAt,
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
  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("approval_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(filters?.limit ?? 100);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.departmentKey) query = query.eq("department_key", filters.departmentKey);
    if (filters?.actionType) query = query.eq("action_type", filters.actionType);

    const { data, error } = await query;
    if (error) {
      logError("governance", "listApprovalRequests failed", { error: error.message, filters });
      return [];
    }

    return (data ?? [])
      .filter((row) => !(row as ApprovalRowLike).deleted_at)
      .map((row) => toModel(row as ApprovalRowLike));
  } catch (error) {
    logError("governance", "listApprovalRequests crashed", {
      error: error instanceof Error ? error.message : String(error),
      filters,
    });
    return [];
  }
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
