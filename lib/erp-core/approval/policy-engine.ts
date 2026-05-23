/**
 * B3.1 — Policy engine approval (règles centralisées, pas de if local métier).
 */

import {
  ERP_APPROVAL_ENGINE_SOURCE,
  type ErpApprovalPolicy,
  type ErpApprovalPolicyKind,
} from "@/lib/erp-core/approval/domain-model";
import { ERP_MUTATION_APPROVAL_POLICIES } from "@/lib/erp-core/approval/mutation-policies";

export type EvaluateMutationApprovalPolicyInput = {
  mutationAction: string;
  departmentKey: string;
  amountGnf?: number | null;
  registryRequiresApproval?: boolean;
};

export function evaluateMutationApprovalPolicy(
  input: EvaluateMutationApprovalPolicyInput,
): ErpApprovalPolicy {
  const rule = ERP_MUTATION_APPROVAL_POLICIES[input.mutationAction];

  if (!rule && !input.registryRequiresApproval) {
    return {
      version: ERP_APPROVAL_ENGINE_SOURCE,
      required: false,
      kind: "auto",
      reason: "Aucune politique approval — passage auto.",
    };
  }

  if (!rule) {
    return {
      version: ERP_APPROVAL_ENGINE_SOURCE,
      required: true,
      kind: "governance_required",
      reason: "Registre mutation requiresApproval sans politique explicite — gouvernance par défaut.",
    };
  }

  let required = rule.required || Boolean(input.registryRequiresApproval);
  let kind: ErpApprovalPolicyKind = rule.policy;

  if (rule.policy === "threshold_required" && rule.amountThresholdGnf != null) {
    const amount = Number(input.amountGnf ?? 0);
    required = amount >= rule.amountThresholdGnf;
    kind = required ? "threshold_required" : "auto";
  }

  return {
    version: ERP_APPROVAL_ENGINE_SOURCE,
    required,
    kind,
    reason: required
      ? rule.description
      : `Seuil non atteint ou politique non requise (${input.mutationAction}).`,
    rule,
  };
}
