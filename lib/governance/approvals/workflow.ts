import { isSensitiveAction } from "@/lib/governance/approvals/is-sensitive-action";
import {
  createApprovalRequest,
  getActiveApprovalForAction,
} from "@/lib/governance/approvals/repository";
import { tryCreateAlert } from "@/lib/governance/alerts/create-alert";
import { tryLogGovernanceAuditEvent } from "@/lib/governance/audit/log-audit-event";
import type { AuditEventType } from "@/lib/audit/audit-types";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import type { ApprovalDecision } from "@/lib/approvals/approval-types";

export class ApprovalRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalRequiredError";
  }
}

export function isApprovalRequiredError(error: unknown): error is ApprovalRequiredError {
  return error instanceof ApprovalRequiredError;
}

type GovernanceApprovalContext = {
  eventType: AuditEventType;
  actorUserId: string;
  actorRole?: string | null;
  departmentKey?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function enforceGovernanceApproval(
  ctx: GovernanceApprovalContext,
): Promise<ApprovalDecision> {
  if (!isSensitiveAction(ctx.eventType)) {
    return {
      required: false,
      granted: true,
      policy: "soft_auto",
      reason: "Action non sensible: approbation non requise.",
    };
  }

  const role = effectiveAuthRoleKey(ctx.actorRole);
  if (role === ROLE_KEYS.SUPER_ADMIN) {
    return {
      required: true,
      granted: true,
      policy: "governance_required",
      reason: "Validation directe autorisee pour super_admin.",
    };
  }

  const departmentKey = String(ctx.departmentKey ?? "UNKNOWN").trim().toUpperCase() || "UNKNOWN";
  const entityType = String(ctx.entityType ?? "unknown_entity").trim().toLowerCase() || "unknown_entity";
  const entityId = String(ctx.entityId ?? "unknown_id").trim() || "unknown_id";

  const existing = await getActiveApprovalForAction({
    departmentKey,
    actionType: ctx.eventType,
    entityType,
    entityId,
    requestedBy: ctx.actorUserId,
  });

  if (existing?.status === "approved") {
    return {
      required: true,
      granted: true,
      policy: "governance_required",
      reason: "Demande d'approbation prealablement validee.",
    };
  }

  if (!existing) {
    await createApprovalRequest({
      departmentKey,
      actionType: ctx.eventType,
      entityType,
      entityId,
      requestedBy: ctx.actorUserId,
      reason: ctx.reason ?? null,
      payloadSnapshot: {
        metadata: ctx.metadata ?? {},
        created_from: "server_action",
      },
    });
    await tryCreateAlert({
      type: "approval_request_created",
      severity: "high",
      departmentKey,
      title: "Nouvelle demande d'approbation sensible",
      description: `Action ${ctx.eventType} en attente de validation gouvernance.`,
      entityType,
      entityId,
      triggeredBy: ctx.actorUserId,
      metadata: {
        eventType: ctx.eventType,
        actorRole: ctx.actorRole ?? null,
      },
    });
    await tryLogGovernanceAuditEvent({
      category: "approval",
      severity: "warning",
      departmentKey,
      actorUserId: ctx.actorUserId,
      actorRole: ctx.actorRole ?? null,
      actionType: "approval_request_created",
      entityType,
      entityId,
      metadata: {
        eventType: ctx.eventType,
        source: "approval_workflow",
      },
      afterSnapshot: {
        status: "pending",
      },
    });
  }

  throw new ApprovalRequiredError(
    "Action sensible transmise au centre de gouvernance. En attente d'approbation super_admin.",
  );
}
