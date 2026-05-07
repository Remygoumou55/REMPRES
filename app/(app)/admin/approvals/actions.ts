"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { decideApprovalRequest } from "@/lib/governance/approvals/repository";
import { tryLogAuditEvent } from "@/lib/audit/audit-logger";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-events";
import { tryCreateAlert } from "@/lib/governance/alerts/create-alert";
import { tryLogGovernanceAuditEvent } from "@/lib/governance/audit/log-audit-event";

async function assertSuperAdminActor(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Non authentifie.");
  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) throw new Error("Acces refuse.");
  return data.user.id;
}

export async function approveRequestAction(requestId: string): Promise<void> {
  const approverUserId = await assertSuperAdminActor();
  await decideApprovalRequest({
    requestId,
    status: "approved",
    approverUserId,
  });
  await tryLogAuditEvent({
    eventType: AUDIT_EVENT_TYPES.APPROVAL_GRANTED,
    severity: "high",
    target: { table: "approval_requests", id: requestId },
    context: { actorUserId: approverUserId, actorRole: "super_admin" },
    details: { operation: "approve_request" },
    approval: { required: false, status: "granted", policy: "governance_center" },
  });
  await tryCreateAlert({
    type: "approval_granted",
    severity: "medium",
    title: "Demande d'approbation validee",
    description: "Une demande sensible a ete approuvee par la gouvernance.",
    entityType: "approval_requests",
    entityId: requestId,
    triggeredBy: approverUserId,
    metadata: { operation: "approve_request" },
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
  revalidatePath("/admin/approvals");
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
  await tryLogAuditEvent({
    eventType: AUDIT_EVENT_TYPES.APPROVAL_REJECTED,
    severity: "high",
    target: { table: "approval_requests", id: requestId },
    context: { actorUserId: approverUserId, actorRole: "super_admin" },
    details: { operation: "reject_request", rejectionReason: rejectionReason ?? null },
    approval: { required: false, status: "granted", policy: "governance_center" },
  });
  await tryCreateAlert({
    type: "approval_rejected",
    severity: "high",
    title: "Demande d'approbation rejetee",
    description: "Une action sensible a ete rejetee par la gouvernance.",
    entityType: "approval_requests",
    entityId: requestId,
    triggeredBy: approverUserId,
    metadata: { operation: "reject_request", rejectionReason: rejectionReason ?? null },
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
  revalidatePath("/admin/approvals");
}
