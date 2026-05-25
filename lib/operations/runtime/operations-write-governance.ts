/**
 * Bloc 3 — Gouvernance chemins d'écriture Operations / Project.
 */

import { assertErpMutationApprovalGate } from "@/lib/erp-core/approval/mutation-gate";
import { assertOperationsRuntimeWriteAccess } from "@/lib/operations/runtime/operations-runtime-security";
import { OPERATIONS_DEPARTMENT_KEY } from "@/modules/operations/constants/module-keys";

export const OPS_WRITE_ACTIONS = {
  TASK_CREATE: "ops.task.create",
  TASK_ASSIGN: "ops.task.assign",
  TASK_UPDATE: "ops.task.update",
  TASK_COMPLETE: "ops.task.complete",
  PROJECT_CREATE: "ops.project.create",
  PROJECT_UPDATE: "ops.project.update",
  WORKFLOW_START: "ops.workflow.start",
  WORKFLOW_TRANSITION: "ops.workflow.transition",
  DELIVERY_CREATE: "ops.delivery.create",
  DELIVERY_UPDATE: "ops.delivery.update",
  DELIVERY_COMPLETE: "ops.delivery.complete",
  REPORT_GENERATE: "ops.report.generate",
} as const;

export type OpsWriteAction = (typeof OPS_WRITE_ACTIONS)[keyof typeof OPS_WRITE_ACTIONS];

export const OPS_WRITE_ACTION_REGISTRY: Record<
  OpsWriteAction,
  { enabled: boolean; requiresApproval: boolean; description: string }
> = {
  [OPS_WRITE_ACTIONS.TASK_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création tâche opérationnelle",
  },
  [OPS_WRITE_ACTIONS.TASK_ASSIGN]: {
    enabled: true,
    requiresApproval: false,
    description: "Assignation exécutant",
  },
  [OPS_WRITE_ACTIONS.TASK_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Mise à jour statut / priorité",
  },
  [OPS_WRITE_ACTIONS.TASK_COMPLETE]: {
    enabled: true,
    requiresApproval: false,
    description: "Clôture tâche",
  },
  [OPS_WRITE_ACTIONS.PROJECT_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création projet gouverné",
  },
  [OPS_WRITE_ACTIONS.PROJECT_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Mise à jour projet",
  },
  [OPS_WRITE_ACTIONS.WORKFLOW_START]: {
    enabled: true,
    requiresApproval: false,
    description: "Démarrage workflow",
  },
  [OPS_WRITE_ACTIONS.WORKFLOW_TRANSITION]: {
    enabled: true,
    requiresApproval: false,
    description: "Transition workflow",
  },
  [OPS_WRITE_ACTIONS.DELIVERY_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création jalon livraison",
  },
  [OPS_WRITE_ACTIONS.DELIVERY_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Mise à jour progression",
  },
  [OPS_WRITE_ACTIONS.DELIVERY_COMPLETE]: {
    enabled: true,
    requiresApproval: false,
    description: "Clôture jalon",
  },
  [OPS_WRITE_ACTIONS.REPORT_GENERATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Rapport opérationnel",
  },
};

export type OpsWriteApprovalContext = {
  entityType: string;
  entityId: string;
  amountGnf?: number | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function assertOpsWriteActionAllowed(
  userId: string,
  action: OpsWriteAction,
  permission: "create" | "update" | "delete" = "update",
  approvalContext?: OpsWriteApprovalContext,
): Promise<void> {
  await assertOperationsRuntimeWriteAccess(userId, permission);

  const rule = OPS_WRITE_ACTION_REGISTRY[action];
  if (!rule.enabled) {
    throw new Error(`ops:write_not_enabled:${action}`);
  }

  if (rule.requiresApproval) {
    if (!approvalContext?.entityId?.trim()) {
      throw new Error("ops:approval_context_required");
    }
    await assertErpMutationApprovalGate({
      userId,
      departmentKey: OPERATIONS_DEPARTMENT_KEY,
      mutationAction: action,
      registryRequiresApproval: rule.requiresApproval,
      approvalContext: {
        entityType: approvalContext.entityType,
        entityId: approvalContext.entityId,
        amountGnf: approvalContext.amountGnf,
        reason: approvalContext.reason,
        metadata: approvalContext.metadata,
      },
    });
  }
}
