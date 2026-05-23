/**
 * P4 — Matrice approval readiness Finance (pas d'activation approval partout).
 */

const FINANCE_WRITE_ACTIONS = {
  EXPENSE_CREATE: "finance.expense.create",
  EXPENSE_UPDATE: "finance.expense.update",
  JOURNAL_POST: "finance.journal.post",
  INVOICE_ISSUE: "finance.invoice.issue",
  PAYMENT_ALLOCATE: "finance.payment.allocate",
} as const;

const FINANCE_APPROVAL_ENTITY_TYPES = {
  journalBatch: "finance_journal_batch",
  arInvoice: "finance_ar_invoice",
  budget: "finance_budget",
  paymentAllocation: "finance_payment_allocation",
} as const;

export const FINANCE_APPROVAL_READINESS_VERSION = "finance-approval-readiness-p4-v1" as const;

export type FinanceApprovalClass = "auto" | "approval_ready" | "future_approval";

export type FinanceApprovalReadinessRow = {
  mutationAction: string;
  approvalClass: FinanceApprovalClass;
  registryRequiresApproval: boolean;
  entityType: string | null;
  b31Gate: "assertErpMutationApprovalGate" | "legacy_assertApprovalOrThrow" | "none";
  rationale: string;
};

export const FINANCE_APPROVAL_READINESS_MATRIX: readonly FinanceApprovalReadinessRow[] = [
  {
    mutationAction: FINANCE_WRITE_ACTIONS.EXPENSE_CREATE,
    approvalClass: "auto",
    registryRequiresApproval: false,
    entityType: "expenses",
    b31Gate: "legacy_assertApprovalOrThrow",
    rationale: "Dépenses opérationnelles — approval legacy actif via depenses/actions.ts",
  },
  {
    mutationAction: FINANCE_WRITE_ACTIONS.EXPENSE_UPDATE,
    approvalClass: "auto",
    registryRequiresApproval: false,
    entityType: "expenses",
    b31Gate: "legacy_assertApprovalOrThrow",
    rationale: "Même chemin legacy ; migration B3.1 lors P4.1",
  },
  {
    mutationAction: FINANCE_WRITE_ACTIONS.JOURNAL_POST,
    approvalClass: "approval_ready",
    registryRequiresApproval: true,
    entityType: FINANCE_APPROVAL_ENTITY_TYPES.journalBatch,
    b31Gate: "assertErpMutationApprovalGate",
    rationale: "Impact comptable — gate B3.1 déjà câblé dans finance-write-governance",
  },
  {
    mutationAction: FINANCE_WRITE_ACTIONS.INVOICE_ISSUE,
    approvalClass: "future_approval",
    registryRequiresApproval: false,
    entityType: FINANCE_APPROVAL_ENTITY_TYPES.arInvoice,
    b31Gate: "assertErpMutationApprovalGate",
    rationale: "AR enterprise — activer requiresApproval lors exposition write TS",
  },
  {
    mutationAction: FINANCE_WRITE_ACTIONS.PAYMENT_ALLOCATE,
    approvalClass: "approval_ready",
    registryRequiresApproval: false,
    entityType: FINANCE_APPROVAL_ENTITY_TYPES.paymentAllocation,
    b31Gate: "assertErpMutationApprovalGate",
    rationale: "Montants élevés — activer requiresApproval avant P4.2 production",
  },
] as const;

export const FINANCE_APPROVAL_READINESS_SUMMARY = {
  autoCount: FINANCE_APPROVAL_READINESS_MATRIX.filter((r) => r.approvalClass === "auto").length,
  approvalReadyCount: FINANCE_APPROVAL_READINESS_MATRIX.filter(
    (r) => r.approvalClass === "approval_ready",
  ).length,
  futureApprovalCount: FINANCE_APPROVAL_READINESS_MATRIX.filter(
    (r) => r.approvalClass === "future_approval",
  ).length,
  rule: "Ne pas activer requiresApproval sur expense tant que legacy assertApprovalOrThrow suffit",
} as const;
