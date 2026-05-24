"use server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidateAdminApprovals } from "@/lib/cache/revalidation-map";
import { isSuperAdmin } from "@/lib/server/permissions";
import { decideApprovalRequest } from "@/lib/governance/approvals/repository";
import { tryLogAuditEvent } from "@/lib/audit/audit-logger";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-events";
import { tryLogGovernanceAuditEvent } from "@/lib/governance/audit/log-audit-event";
import {
  emitApprovalRequestApproved,
  emitApprovalRequestRejected,
} from "@/lib/erp-core/events/integrations/approval-events";

async function assertSuperAdminActor(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Non authentifie.");
  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) throw new Error("Acces refuse.");
  return data.user.id;
}

async function loadApprovalMeta(requestId: string) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("approval_requests")
    .select("department_key, action_type")
    .eq("id", requestId)
    .maybeSingle();
  return {
    departmentKey: String(data?.department_key ?? "UNKNOWN"),
    actionType: data?.action_type ?? null,
  };
}

export async function approveRequestAction(requestId: string): Promise<void> {
  const approverUserId = await assertSuperAdminActor();
  await decideApprovalRequest({
    requestId,
    status: "approved",
    approverUserId,
  });
  const meta = await loadApprovalMeta(requestId);
  await emitApprovalRequestApproved({
    approverUserId,
    departmentKey: meta.departmentKey,
    requestId,
    mutationAction: meta.actionType,
  });
  await tryLogAuditEvent({
    eventType: AUDIT_EVENT_TYPES.APPROVAL_GRANTED,
    severity: "high",
    target: { table: "approval_requests", id: requestId },
    context: { actorUserId: approverUserId, actorRole: "super_admin" },
    details: { operation: "approve_request" },
    approval: { required: false, status: "granted", policy: "governance_center" },
  });
  await tryLogGovernanceAuditEvent({
    category: "approval",
    severity: "informational",
    actorUserId: approverUserId,
    actorRole: "super_admin",
    actionType: "approval_granted",
    entityType: "approval_requests",
    entityId: requestId,
    afterSnapshot: { status: "approved" },
    metadata: { operation: "approve_request" },
  });
  await revalidateAdminApprovals();
}

export async function rejectRequestAction(
  requestId: string,
  rejectionReason?: string,
): Promise<void> {
  const approverUserId = await assertSuperAdminActor();
  await decideApprovalRequest({
    requestId,
    status: "rejected",
    approverUserId,
    rejectionReason: rejectionReason ?? null,
  });
  const meta = await loadApprovalMeta(requestId);
  await emitApprovalRequestRejected({
    approverUserId,
    departmentKey: meta.departmentKey,
    requestId,
    rejectionReason: rejectionReason ?? null,
  });
  await tryLogAuditEvent({
    eventType: AUDIT_EVENT_TYPES.APPROVAL_REJECTED,
    severity: "high",
    target: { table: "approval_requests", id: requestId },
    context: { actorUserId: approverUserId, actorRole: "super_admin" },
    details: { operation: "reject_request", rejectionReason: rejectionReason ?? null },
    approval: { required: false, status: "granted", policy: "governance_center" },
  });
  await tryLogGovernanceAuditEvent({
    category: "approval",
    severity: "critical",
    actorUserId: approverUserId,
    actorRole: "super_admin",
    actionType: "approval_rejected",
    entityType: "approval_requests",
    entityId: requestId,
    afterSnapshot: { status: "rejected" },
    metadata: { operation: "reject_request", rejectionReason: rejectionReason ?? null },
  });
  await revalidateAdminApprovals();
}
