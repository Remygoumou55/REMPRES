/**
 * Bloc 3 — Gouvernance chemins d'écriture Supply / Logistique.
 */

import { assertErpMutationApprovalGate } from "@/lib/erp-core/approval/mutation-gate";
import { LOGISTICS_DEPARTMENT_KEY } from "@/modules/logistics/constants/module-keys";
import { assertLogisticsRuntimeWriteAccess } from "@/lib/logistics/runtime/logistics-runtime-security";

export const LOGISTICS_WRITE_ACTIONS = {
  SUPPLIER_CREATE: "supply.supplier.create",
  SUPPLIER_UPDATE: "supply.supplier.update",
  PO_CREATE: "supply.po.create",
  PO_SUBMIT: "supply.po.submit",
  PO_APPROVE: "supply.po.approve",
  RECEIPT_CREATE: "supply.receipt.create",
  STOCK_ADJUST: "supply.stock.adjust",
  STOCK_TRANSFER: "supply.stock.transfer",
  REPORT_GENERATE: "supply.report.generate",
} as const;

export type LogisticsWriteAction =
  (typeof LOGISTICS_WRITE_ACTIONS)[keyof typeof LOGISTICS_WRITE_ACTIONS];

export const LOGISTICS_WRITE_ACTION_REGISTRY: Record<
  LogisticsWriteAction,
  { enabled: boolean; requiresApproval: boolean; description: string }
> = {
  [LOGISTICS_WRITE_ACTIONS.SUPPLIER_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création fournisseur",
  },
  [LOGISTICS_WRITE_ACTIONS.SUPPLIER_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Activation / suspension fournisseur",
  },
  [LOGISTICS_WRITE_ACTIONS.PO_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création commande achat brouillon",
  },
  [LOGISTICS_WRITE_ACTIONS.PO_SUBMIT]: {
    enabled: true,
    requiresApproval: false,
    description: "Soumission PO — revue procurement",
  },
  [LOGISTICS_WRITE_ACTIONS.PO_APPROVE]: {
    enabled: true,
    requiresApproval: false,
    description: "Approbation PO (statut approved)",
  },
  [LOGISTICS_WRITE_ACTIONS.RECEIPT_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Réception marchandises",
  },
  [LOGISTICS_WRITE_ACTIONS.STOCK_ADJUST]: {
    enabled: true,
    requiresApproval: false,
    description: "Ajustement inventaire",
  },
  [LOGISTICS_WRITE_ACTIONS.STOCK_TRANSFER]: {
    enabled: true,
    requiresApproval: false,
    description: "Transfert inter-entrepôts",
  },
  [LOGISTICS_WRITE_ACTIONS.REPORT_GENERATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Génération rapport supply",
  },
};

export type LogisticsWriteApprovalContext = {
  entityType: string;
  entityId: string;
  amountGnf?: number | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function assertLogisticsWriteActionAllowed(
  userId: string,
  action: LogisticsWriteAction,
  permission: "create" | "update" | "delete" = "update",
  approvalContext?: LogisticsWriteApprovalContext,
): Promise<void> {
  await assertLogisticsRuntimeWriteAccess(userId, permission);

  const rule = LOGISTICS_WRITE_ACTION_REGISTRY[action];
  if (!rule.enabled) {
    throw new Error(`supply:write_not_enabled:${action}`);
  }

  if (rule.requiresApproval) {
    if (!approvalContext?.entityId?.trim()) {
      throw new Error("supply:approval_context_required");
    }
    await assertErpMutationApprovalGate({
      userId,
      departmentKey: LOGISTICS_DEPARTMENT_KEY,
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
