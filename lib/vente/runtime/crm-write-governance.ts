/**
 * B2.0 — Gouvernance chemins d'écriture CRM (contrat B2.1, pas de build métier ici).
 */

import { assertErpMutationApprovalGate } from "@/lib/erp-core/approval/mutation-gate";
import { CRM_DEPARTMENT_KEY } from "@/modules/crm/constants/module-keys";
import { assertCrmRuntimeWriteAccess } from "@/lib/vente/runtime/vente-runtime-security";

export const CRM_WRITE_ACTIONS = {
  LEAD_CREATE: "crm.lead.create",
  LEAD_UPDATE_STATUS: "crm.lead.update_status",
  LEAD_CONVERT: "crm.lead.convert",
  OPPORTUNITY_CREATE: "crm.opportunity.create",
  OPPORTUNITY_UPDATE_STAGE: "crm.opportunity.update_stage",
  QUOTE_CREATE: "crm.quote.create",
  QUOTE_UPDATE_STATUS: "crm.quote.update_status",
  QUOTE_CONVERT_SALE: "crm.quote.convert_sale",
  ACTIVITY_CREATE: "crm.activity.create",
  ACTIVITY_COMPLETE: "crm.activity.complete",
} as const;

export type CrmWriteAction = (typeof CRM_WRITE_ACTIONS)[keyof typeof CRM_WRITE_ACTIONS];

/** Actions autorisées à enregistrer — implémentation métier = phase B2.1+. */
export const CRM_WRITE_ACTION_REGISTRY: Record<
  CrmWriteAction,
  { enabled: boolean; requiresApproval: boolean; description: string }
> = {
  [CRM_WRITE_ACTIONS.LEAD_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création lead — B2.1",
  },
  [CRM_WRITE_ACTIONS.LEAD_UPDATE_STATUS]: {
    enabled: true,
    requiresApproval: false,
    description: "Transition statut lead — B2.1",
  },
  [CRM_WRITE_ACTIONS.LEAD_CONVERT]: {
    enabled: true,
    requiresApproval: false,
    description: "Conversion lead → client — B2.1",
  },
  [CRM_WRITE_ACTIONS.OPPORTUNITY_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création opportunité — B2.1",
  },
  [CRM_WRITE_ACTIONS.OPPORTUNITY_UPDATE_STAGE]: {
    enabled: true,
    requiresApproval: false,
    description: "Changement étape pipeline — B2.1",
  },
  [CRM_WRITE_ACTIONS.QUOTE_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création devis — B2.1",
  },
  [CRM_WRITE_ACTIONS.QUOTE_UPDATE_STATUS]: {
    enabled: true,
    requiresApproval: false,
    description: "Transition statut devis — B2.1",
  },
  [CRM_WRITE_ACTIONS.QUOTE_CONVERT_SALE]: {
    enabled: true,
    requiresApproval: true,
    description: "Conversion devis → vente — B2.2 (RPC convert_crm_quote_to_sale)",
  },
  [CRM_WRITE_ACTIONS.ACTIVITY_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création activité — B2.1",
  },
  [CRM_WRITE_ACTIONS.ACTIVITY_COMPLETE]: {
    enabled: true,
    requiresApproval: false,
    description: "Clôture activité — B2.1",
  },
};

export type CrmWriteApprovalContext = {
  entityType: string;
  entityId: string;
  amountGnf?: number | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export type CrmWriteGateResult = {
  action: CrmWriteAction;
  userId: string;
  allowed: boolean;
  requiresApproval: boolean;
  approvalGranted: boolean;
};

/**
 * Porte d'entrée unique pour toute mutation CRM future.
 * B2.0 : vérifie SEC-1 + registre ; lève si action non encore activée.
 */
export async function assertCrmWriteActionAllowed(
  userId: string,
  action: CrmWriteAction,
  permission: "create" | "update" | "delete" = "update",
  approvalContext?: CrmWriteApprovalContext,
): Promise<CrmWriteGateResult> {
  await assertCrmRuntimeWriteAccess(userId, permission);

  const rule = CRM_WRITE_ACTION_REGISTRY[action];
  if (!rule.enabled) {
    throw new Error(`crm:write_not_enabled:${action}`);
  }

  let approvalGranted = !rule.requiresApproval;

  if (rule.requiresApproval) {
    if (!approvalContext?.entityId?.trim()) {
      throw new Error("crm:approval_context_required");
    }
    const decision = await assertErpMutationApprovalGate({
      userId,
      departmentKey: CRM_DEPARTMENT_KEY,
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
    approvalGranted = decision.granted;
  }

  return {
    action,
    userId,
    allowed: true,
    requiresApproval: rule.requiresApproval,
    approvalGranted,
  };
}
