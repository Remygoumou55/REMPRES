/**
 * B3.1 — Traçabilité approval → governance_audit_events.
 */

import { tryLogGovernanceAuditEvent } from "@/lib/governance/audit/log-audit-event";
import type { ErpApprovalScope } from "@/lib/erp-core/approval/domain-model";
import { ERP_APPROVAL_ENGINE_SOURCE } from "@/lib/erp-core/approval/domain-model";

export async function recordApprovalEngineAudit(params: {
  actionType: string;
  departmentKey: string;
  actorUserId: string;
  actorRole?: string | null;
  scope: ErpApprovalScope;
  requestId?: string | null;
  beforeSnapshot?: Record<string, unknown> | null;
  afterSnapshot?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await tryLogGovernanceAuditEvent({
    category: "approval",
    severity: "informational",
    departmentKey: params.departmentKey,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole ?? null,
    actionType: params.actionType,
    entityType: params.scope.entityType,
    entityId: params.scope.entityId,
    metadata: {
      engine: ERP_APPROVAL_ENGINE_SOURCE,
      mutationAction: params.scope.actionType,
      approvalRequestId: params.requestId ?? null,
      ...(params.metadata ?? {}),
    },
    beforeSnapshot: params.beforeSnapshot ?? null,
    afterSnapshot: params.afterSnapshot ?? null,
  });
}
