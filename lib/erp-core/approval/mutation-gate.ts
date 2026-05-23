/**
 * B3.1 — Porte mutation B2.4 + approval exécutable (requiresApproval ≠ documentaire).
 */

import {
  createApprovalRequest,
  getActiveApprovalForAction,
} from "@/lib/governance/approvals/repository";
import {
  ApprovalRequiredError,
  isApprovalRequiredError,
} from "@/lib/governance/approvals/workflow";
import type { ErpApprovalDecision } from "@/lib/erp-core/approval/domain-model";
import { evaluateMutationApprovalPolicy } from "@/lib/erp-core/approval/policy-engine";
import {
  assertCanSubmitApprovalRequest,
  departmentKeyForMutation,
} from "@/lib/erp-core/approval/security";
import { recordApprovalEngineAudit } from "@/lib/erp-core/approval/audit-trace";
import { logicalStatusFromDb } from "@/lib/erp-core/approval/lifecycle";
import {
  emitApprovalGateGranted,
  emitApprovalRequestCreated,
  emitMutationBlockedPending,
} from "@/lib/erp-core/events/integrations/approval-events";

export { ApprovalRequiredError, isApprovalRequiredError };

export type ErpMutationApprovalContext = {
  entityType: string;
  entityId: string;
  amountGnf?: number | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export type ErpMutationApprovalGateInput = {
  userId: string;
  departmentKey: string;
  mutationAction: string;
  registryRequiresApproval: boolean;
  approvalContext: ErpMutationApprovalContext;
};

/**
 * Bloque la mutation tant qu'aucune approbation active n'existe (pending → erreur, approved → OK).
 */
export async function assertErpMutationApprovalGate(
  input: ErpMutationApprovalGateInput,
): Promise<ErpApprovalDecision> {
  const dept = departmentKeyForMutation(input.departmentKey);
  const entityId = String(input.approvalContext.entityId ?? "").trim();
  const entityType = String(input.approvalContext.entityType ?? "unknown_entity").trim().toLowerCase();

  if (!entityId) {
    throw new Error("erp:approval_context_required:entityId");
  }

  const policy = evaluateMutationApprovalPolicy({
    mutationAction: input.mutationAction,
    departmentKey: dept,
    amountGnf: input.approvalContext.amountGnf,
    registryRequiresApproval: input.registryRequiresApproval,
  });

  if (!policy.required) {
    return {
      required: false,
      granted: true,
      policy,
      reason: policy.reason,
    };
  }

  const actor = await assertCanSubmitApprovalRequest(input.userId, dept);

  const scope = {
    departmentKey: dept,
    actionType: input.mutationAction,
    entityType,
    entityId,
  };

  const existing = await getActiveApprovalForAction({
    departmentKey: dept,
    actionType: input.mutationAction,
    entityType,
    entityId,
    requestedBy: input.userId,
  });

  if (existing?.status === "approved") {
    await recordApprovalEngineAudit({
      actionType: "approval_gate_granted",
      departmentKey: dept,
      actorUserId: input.userId,
      actorRole: actor.roleKey,
      scope,
      requestId: existing.id,
      afterSnapshot: { status: "approved" },
    });
    await emitApprovalGateGranted({
      actorUserId: input.userId,
      departmentKey: dept,
      requestId: existing.id,
      mutationAction: input.mutationAction,
    });
    return {
      required: true,
      granted: true,
      policy,
      requestId: existing.id,
      reason: "Approbation préalable validée.",
    };
  }

  if (existing?.status === "pending") {
    await emitMutationBlockedPending({
      actorUserId: input.userId,
      departmentKey: dept,
      requestId: existing.id,
      mutationAction: input.mutationAction,
    });
    throw new ApprovalRequiredError(
      `Action « ${input.mutationAction} » en attente d'approbation (demande ${existing.id.slice(0, 8)}…).`,
    );
  }

  const created = await createApprovalRequest({
    departmentKey: dept,
    actionType: input.mutationAction,
    entityType,
    entityId,
    requestedBy: input.userId,
    reason: input.approvalContext.reason ?? null,
    payloadSnapshot: {
      amount_gnf: input.approvalContext.amountGnf ?? null,
      metadata: input.approvalContext.metadata ?? {},
      engine: policy.version,
      logical_status: "submitted",
    },
  });

  await recordApprovalEngineAudit({
    actionType: "approval_request_created",
    departmentKey: dept,
    actorUserId: input.userId,
    actorRole: actor.roleKey,
    scope,
    requestId: created.id,
    afterSnapshot: {
      status: logicalStatusFromDb(created.status),
      dbStatus: created.status,
    },
  });

  await emitApprovalRequestCreated({
    actorUserId: input.userId,
    departmentKey: dept,
    requestId: created.id,
    mutationAction: input.mutationAction,
    entityType,
    entityId,
    payload: input.approvalContext.metadata,
  });

  throw new ApprovalRequiredError(
    `Mutation « ${input.mutationAction} » soumise au centre d'approbation. ID : ${created.id}.`,
  );
}
