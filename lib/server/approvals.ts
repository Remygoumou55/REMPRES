import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { Json } from "@/types/database.types";
import type { Database } from "@/types/database.types";
import { tryEmitGovernanceAlert } from "@/lib/governance/alert-engine";
import { cache } from "react";
import { revalidateTag } from "next/cache";

export const PENDING_APPROVALS_COUNT_TAG = "pending-approvals-count";

export interface CreateApprovalInput {
  requestedBy: string;
  requesterName: string;
  requesterRole: string;
  requesterDept: string;
  actionType: string;
  module: string;
  targetId?: string;
  targetLabel: string;
  description: string;
  actionPayload: Record<string, unknown>;
  priority?: string;
}

type ApprovalRow = Record<string, unknown>;

function moduleToDepartmentKey(module: string): string {
  return String(module ?? "unknown").trim().toUpperCase() || "UNKNOWN";
}

function buildInsertRow(input: CreateApprovalInput): Database["public"]["Tables"]["approval_requests"]["Insert"] {
  const departmentKey = moduleToDepartmentKey(input.module);
  const entityId = input.targetId ?? String(input.actionPayload.id ?? "unknown");
  const payload: Record<string, unknown> = {
    ...input.actionPayload,
    requester_name: input.requesterName,
    requester_role: input.requesterRole,
    requester_dept: input.requesterDept,
    target_label: input.targetLabel,
    priority: input.priority ?? "normal",
    module: input.module,
    description: input.description,
  };

  return {
    department_key: departmentKey,
    action_type: input.actionType,
    entity_type: input.module,
    entity_id: entityId,
    requested_by: input.requestedBy,
    reason: input.description,
    payload_snapshot: payload as Json,
    status: "pending",
  };
}

function normalizeRow(row: ApprovalRow): ApprovalRow {
  const payload =
    (row.action_payload as Record<string, unknown> | null) ??
    (row.payload_snapshot as Record<string, unknown> | null) ??
    {};

  const status =
    row.status === "approved" && payload.executed_at ? "executed" : row.status;

  return {
    ...row,
    status,
    requester_name: row.requester_name ?? payload.requester_name ?? null,
    requester_role: row.requester_role ?? payload.requester_role ?? null,
    requester_dept: row.requester_dept ?? payload.requester_dept ?? row.department_key ?? null,
    module: row.module ?? payload.module ?? row.entity_type ?? null,
    target_id: row.target_id ?? row.entity_id ?? null,
    target_label: row.target_label ?? payload.target_label ?? null,
    description: row.description ?? row.reason ?? payload.description ?? null,
    action_payload: payload,
    priority: row.priority ?? payload.priority ?? "normal",
    review_comment: row.review_comment ?? row.rejection_reason ?? null,
  };
}

export async function createApprovalRequest(
  input: CreateApprovalInput,
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("approval_requests")
      .insert(buildInsertRow(input))
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    try {
      await notifySuperAdmins(String(data.id), input);
    } catch (notifErr) {
      console.error("[Approval] notify failed:", notifErr);
    }

    try {
      revalidateTag(PENDING_APPROVALS_COUNT_TAG);
    } catch {
      /* ignore */
    }

    return { success: true, requestId: String(data.id) };
  } catch (err) {
    console.error("[Approval] create failed:", err);
    return { success: false, error: "Erreur lors de la création de la demande" };
  }
}

async function notifySuperAdmins(requestId: string, input: CreateApprovalInput): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  const { data: admins } = await adminClient
    .from("profiles")
    .select("id")
    .eq("role_key", "super_admin")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (!admins?.length) return;

  const link = `/actions/approbations?id=${requestId}`;

  try {
    await adminClient.from("notifications" as never).insert(
      admins.map((admin) => ({
        user_id: admin.id,
        title: `Approbation requise — ${input.requesterDept}`,
        message: input.description,
        type: "approval_required",
        link,
      })) as never,
    );
  } catch {
    await tryEmitGovernanceAlert({
      type: "approval_request_created",
      departmentKey: moduleToDepartmentKey(input.module),
      title: `Approbation requise — ${input.requesterDept}`,
      description: input.description,
      entityType: "approval_requests",
      entityId: requestId,
      triggeredBy: input.requestedBy,
      metadata: { link, requester_dept: input.requesterDept },
    });
  }
}

const loadPendingApprovalsCount = cache(async (): Promise<number> => {
  try {
    const supabase = getSupabaseServerClient();
    const { count, error } = await supabase
      .from("approval_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
});

export const countPendingApprovals = loadPendingApprovalsCount;

export function invalidatePendingApprovalsCount(): void {
  try {
    revalidateTag(PENDING_APPROVALS_COUNT_TAG);
  } catch {
    /* ignore */
  }
}

export async function listApprovals(status?: string): Promise<ApprovalRow[]> {
  try {
    const supabase = getSupabaseServerClient();
    let query = supabase.from("approval_requests").select("*").order("requested_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq(
        "status",
        status as "pending" | "approved" | "rejected" | "expired",
      );
    } else if (!status) {
      query = query.eq("status", "pending");
    }

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []).map((row) => normalizeRow(row as ApprovalRow));
  } catch {
    return [];
  }
}

export async function approveRequest(
  requestId: string,
  reviewerId: string,
  comment?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const { data: req } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (!req) {
      return { success: false, error: "Demande introuvable" };
    }
    if (req.status !== "pending") {
      return { success: false, error: "Cette demande a déjà été traitée" };
    }

    const reviewedAt = new Date().toISOString();
    await supabase
      .from("approval_requests")
      .update({
        status: "approved",
        approved_by: reviewerId,
        approved_at: reviewedAt,
        rejection_reason: comment ?? null,
      })
      .eq("id", requestId);

    try {
      await executeAction(normalizeRow(req as ApprovalRow));
    } catch (execErr) {
      console.error("[Approval] execute failed:", execErr);
    }

    try {
      await notifyRequester(normalizeRow(req as ApprovalRow), "approved", comment);
    } catch {
      /* silent */
    }

    invalidatePendingApprovalsCount();

    return { success: true };
  } catch (err) {
    console.error("[Approval] approve failed:", err);
    return { success: false, error: "Erreur lors de l'approbation" };
  }
}

export async function rejectRequest(
  requestId: string,
  reviewerId: string,
  comment: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServerClient();

    const { data: req } = await supabase
      .from("approval_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (!req) {
      return { success: false, error: "Demande introuvable" };
    }

    const reviewedAt = new Date().toISOString();
    const existingPayload =
      req.payload_snapshot && typeof req.payload_snapshot === "object"
        ? (req.payload_snapshot as Record<string, unknown>)
        : {};

    await supabase
      .from("approval_requests")
      .update({
        status: "rejected",
        approved_by: null,
        approved_at: null,
        rejected_at: reviewedAt,
        rejection_reason: comment,
        payload_snapshot: {
          ...existingPayload,
          reviewed_by: reviewerId,
          review_comment: comment,
        } as Json,
      })
      .eq("id", requestId);

    try {
      await notifyRequester(normalizeRow(req as ApprovalRow), "rejected", comment);
    } catch {
      /* silent */
    }

    invalidatePendingApprovalsCount();

    return { success: true };
  } catch (err) {
    console.error("[Approval] reject failed:", err);
    return { success: false, error: "Erreur lors du rejet" };
  }
}

async function executeAction(req: ApprovalRow): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  const payload = (req.action_payload as Record<string, unknown>) ?? {};
  const targetId = String(payload.id ?? req.target_id ?? req.entity_id ?? "");

  const softDelete = async (table: string, id: string) => {
    if (!id) return;
    await adminClient
      .from(table as never)
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq("id", id);
  };

  switch (req.action_type as string) {
    case "delete_sale":
      if (targetId) {
        await adminClient.rpc("archive_and_soft_delete_sale", { p_sale_id: targetId });
      }
      break;
    case "delete_client":
      await softDelete("clients", targetId);
      break;
    case "delete_product":
      await softDelete("products", targetId);
      break;
    case "delete_employee":
      await softDelete("employees", targetId);
      break;
    case "cancel_formation":
      if (payload.operation === "soft_delete") {
        await softDelete("trainings", targetId);
      } else if (targetId) {
        await adminClient
          .from("trainings" as never)
          .update({ status: "cancelled" } as never)
          .eq("id", targetId);
      }
      break;
    case "delete_mission":
      await softDelete("missions", targetId);
      break;
    case "delete_stock_item":
      await softDelete("stock_items", targetId);
      break;
    case "approve_purchase_order":
      if (targetId) {
        await adminClient
          .from("simple_purchase_orders" as never)
          .update({
            status: "approved",
            approved_at: new Date().toISOString(),
          } as never)
          .eq("id", targetId);
      }
      break;
    case "large_expense":
      if (payload.expense_id) {
        await adminClient
          .from("expenses")
          .update({ status: "validated" } as never)
          .eq("id", String(payload.expense_id));
      }
      break;
  }

  const existingPayload = (req.action_payload as Record<string, unknown>) ?? {};
  await adminClient
    .from("approval_requests")
    .update({
      status: "approved",
      payload_snapshot: {
        ...existingPayload,
        executed_at: new Date().toISOString(),
      } as Json,
    })
    .eq("id", String(req.id));
}

async function notifyRequester(
  req: ApprovalRow,
  decision: "approved" | "rejected",
  comment?: string,
): Promise<void> {
  const adminClient = getSupabaseAdminClient();
  const approved = decision === "approved";
  const targetLabel = String(req.target_label ?? "votre demande");
  const message = approved
    ? `Votre demande "${targetLabel}" a été approuvée et exécutée.`
    : `Votre demande "${targetLabel}" a été rejetée.${comment ? ` Raison : ${comment}` : ""}`;

  try {
    await adminClient.from("notifications" as never).insert({
      user_id: req.requested_by,
      title: approved ? "Demande approuvée" : "Demande rejetée",
      message,
      type: approved ? "approval_approved" : "approval_rejected",
      link: "/actions/approbations",
    } as never);
  } catch {
    await tryEmitGovernanceAlert({
      type: approved ? "approval_granted" : "approval_rejected",
      departmentKey: String(req.requester_dept ?? req.department_key ?? "UNKNOWN"),
      title: approved ? "Demande approuvée" : "Demande rejetée",
      description: message,
      entityType: "approval_requests",
      entityId: String(req.id ?? ""),
      triggeredBy: String(req.requested_by ?? ""),
      metadata: { decision, comment: comment ?? null },
    });
  }
}
