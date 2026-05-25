/**
 * B3 — Registre mutations Finance (contrat B2.4 ; implémentations métier = phases ultérieures).
 */

import { assertErpMutationApprovalGate } from "@/lib/erp-core/approval/mutation-gate";
import { FINANCE_DEPARTMENT_KEY } from "@/modules/finance/constants/module-keys";
import { assertFinanceRuntimeWriteAccess } from "@/lib/finance/runtime/finance-runtime-security";

export const FINANCE_WRITE_ACTIONS = {
  EXPENSE_CREATE: "finance.expense.create",
  EXPENSE_UPDATE: "finance.expense.update",
  JOURNAL_SUBMIT_APPROVAL: "finance.journal.submit_approval",
  JOURNAL_POST: "finance.journal.post",
  INVOICE_ISSUE: "finance.invoice.issue",
  PAYMENT_ALLOCATE: "finance.payment.allocate",
  REPORT_GENERATE: "finance.report.generate",
} as const;

export type FinanceWriteAction = (typeof FINANCE_WRITE_ACTIONS)[keyof typeof FINANCE_WRITE_ACTIONS];

export const FINANCE_WRITE_ACTION_REGISTRY: Record<
  FinanceWriteAction,
  { enabled: boolean; requiresApproval: boolean; description: string }
> = {
  [FINANCE_WRITE_ACTIONS.EXPENSE_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création dépense — P4.1 bus + gate B3",
  },
  [FINANCE_WRITE_ACTIONS.EXPENSE_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Modification dépense — P4.1 bus + gate B3",
  },
  [FINANCE_WRITE_ACTIONS.JOURNAL_SUBMIT_APPROVAL]: {
    enabled: true,
    requiresApproval: false,
    description: "Soumission lot journal pour approbation — Bloc 3",
  },
  [FINANCE_WRITE_ACTIONS.JOURNAL_POST]: {
    enabled: true,
    requiresApproval: false,
    description: "Comptabilisation lot journal — RPC + audit Bloc 3",
  },
  [FINANCE_WRITE_ACTIONS.INVOICE_ISSUE]: {
    enabled: false,
    requiresApproval: false,
    description: "Émission facture AR",
  },
  [FINANCE_WRITE_ACTIONS.PAYMENT_ALLOCATE]: {
    enabled: false,
    requiresApproval: false,
    description: "Allocation paiement",
  },
  [FINANCE_WRITE_ACTIONS.REPORT_GENERATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Génération rapport opérationnel — Bloc 3",
  },
};

export type FinanceWriteApprovalContext = {
  entityType: string;
  entityId: string;
  amountGnf?: number | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export async function assertFinanceWriteActionAllowed(
  userId: string,
  action: FinanceWriteAction,
  permission: "create" | "update" | "delete" = "update",
  approvalContext?: FinanceWriteApprovalContext,
): Promise<void> {
  await assertFinanceRuntimeWriteAccess(userId, permission);
  const rule = FINANCE_WRITE_ACTION_REGISTRY[action];
  if (!rule.enabled) {
    throw new Error(`finance:write_not_enabled:${action}`);
  }

  if (rule.requiresApproval) {
    if (!approvalContext?.entityId?.trim()) {
      throw new Error("finance:approval_context_required");
    }
    await assertErpMutationApprovalGate({
      userId,
      departmentKey: FINANCE_DEPARTMENT_KEY,
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
