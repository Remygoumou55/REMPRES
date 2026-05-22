/**
 * B3 — Registre mutations Finance (contrat B2.4 ; implémentations métier = phases ultérieures).
 */

import { assertFinanceRuntimeWriteAccess } from "@/lib/finance/runtime/finance-runtime-security";

export const FINANCE_WRITE_ACTIONS = {
  EXPENSE_CREATE: "finance.expense.create",
  EXPENSE_UPDATE: "finance.expense.update",
  JOURNAL_POST: "finance.journal.post",
  INVOICE_ISSUE: "finance.invoice.issue",
  PAYMENT_ALLOCATE: "finance.payment.allocate",
} as const;

export type FinanceWriteAction = (typeof FINANCE_WRITE_ACTIONS)[keyof typeof FINANCE_WRITE_ACTIONS];

export const FINANCE_WRITE_ACTION_REGISTRY: Record<
  FinanceWriteAction,
  { enabled: boolean; requiresApproval: boolean; description: string }
> = {
  [FINANCE_WRITE_ACTIONS.EXPENSE_CREATE]: {
    enabled: false,
    requiresApproval: false,
    description: "Création dépense — à activer phase Finance write",
  },
  [FINANCE_WRITE_ACTIONS.EXPENSE_UPDATE]: {
    enabled: false,
    requiresApproval: false,
    description: "Modification dépense — à activer phase Finance write",
  },
  [FINANCE_WRITE_ACTIONS.JOURNAL_POST]: {
    enabled: false,
    requiresApproval: true,
    description: "Comptabilisation lot journal",
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
};

export async function assertFinanceWriteActionAllowed(
  userId: string,
  action: FinanceWriteAction,
  permission: "create" | "update" | "delete" = "update",
): Promise<void> {
  await assertFinanceRuntimeWriteAccess(userId, permission);
  const rule = FINANCE_WRITE_ACTION_REGISTRY[action];
  if (!rule.enabled) {
    throw new Error(`finance:write_not_enabled:${action}`);
  }
}
