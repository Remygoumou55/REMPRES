/**
 * P7.1 — Gate B3 mutations RH.
 */

import { assertErpMutationApprovalGate } from "@/lib/erp-core/approval/mutation-gate";
import { HR_DEPARTMENT_KEY } from "@/lib/hr/governance/hr-domain-governance";
import { assertHrRuntimeWriteAccess } from "@/lib/hr/runtime/hr-runtime-security";
import {
  HR_WRITE_ACTION_REGISTRY,
  type HrWriteAction,
} from "@/lib/hr/runtime/hr-write-registry";

export {
  HR_WRITE_ACTIONS,
  HR_WRITE_ACTION_REGISTRY,
  HR_WRITE_GOVERNANCE_SUMMARY,
  type HrWriteAction,
} from "@/lib/hr/runtime/hr-write-registry";

export type HrWriteApprovalContext = {
  entityType: string;
  entityId: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function assertHrWriteActionAllowed(
  userId: string,
  action: HrWriteAction,
  permission: "create" | "update" | "delete" = "update",
  approvalContext?: HrWriteApprovalContext,
): Promise<void> {
  await assertHrRuntimeWriteAccess(userId, permission);
  const rule = HR_WRITE_ACTION_REGISTRY[action];
  if (!rule.enabled) {
    throw new Error(`hr:write_not_enabled:${action}`);
  }

  if (rule.requiresApproval) {
    if (!approvalContext?.entityId?.trim()) {
      throw new Error("hr:approval_context_required");
    }
    await assertErpMutationApprovalGate({
      userId,
      departmentKey: HR_DEPARTMENT_KEY,
      mutationAction: action,
      registryRequiresApproval: rule.requiresApproval,
      approvalContext: {
        entityType: approvalContext.entityType,
        entityId: approvalContext.entityId,
        reason: approvalContext.reason,
        metadata: approvalContext.metadata,
      },
    });
  }
}
