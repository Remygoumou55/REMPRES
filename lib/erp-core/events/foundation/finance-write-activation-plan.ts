/**
 * P4 — Plan d'activation write Finance (registry → gate → write → publisher → audit).
 * Toutes mutations restent enabled:false jusqu'à P4.1 ciblé.
 */

/** Constantes locales — éviter import finance-write-governance (tire approval → cache Vitest). */
const FINANCE_WRITE_ACTIONS = {
  EXPENSE_CREATE: "finance.expense.create",
  EXPENSE_UPDATE: "finance.expense.update",
  JOURNAL_POST: "finance.journal.post",
  INVOICE_ISSUE: "finance.invoice.issue",
  PAYMENT_ALLOCATE: "finance.payment.allocate",
} as const;

export const FINANCE_WRITE_ACTIVATION_PLAN_VERSION = "finance-write-activation-p4-v1" as const;

export type FinanceWriteActivationPhase =
  | "active"
  | "blocked"
  | "prepare_p4_1"
  | "prepare_p4_2"
  | "future";

export type FinanceWriteActivationRow = {
  mutationAction: string;
  registryEnabled: boolean;
  requiresApproval: boolean;
  activationPhase: FinanceWriteActivationPhase;
  gate: string;
  writeTarget: string;
  publisher: string;
  audit: string;
  futureHandler: string;
  runtimeImpact: "low" | "medium" | "high";
  approvalReadiness: "auto" | "approval_ready" | "future_approval";
};

export const FINANCE_WRITE_ACTIVATION_TABLE: readonly FinanceWriteActivationRow[] = [
  {
    mutationAction: FINANCE_WRITE_ACTIONS.EXPENSE_CREATE,
    registryEnabled: true,
    requiresApproval: false,
    activationPhase: "active",
    gate: "assertFinanceWriteActionAllowed → assertFinanceRuntimeWriteAccess",
    writeTarget: "finance-expense-mutations.ts → RPC create_expense_transaction",
    publisher: "emitFinanceExpenseCreated",
    audit: "tryLogAuditEvent (legacy) + recordFinanceGovernanceAudit (futur)",
    futureHandler: "notification-finance-bridge (P5)",
    runtimeImpact: "medium",
    approvalReadiness: "auto",
  },
  {
    mutationAction: FINANCE_WRITE_ACTIONS.EXPENSE_UPDATE,
    registryEnabled: true,
    requiresApproval: false,
    activationPhase: "active",
    gate: "assertFinanceWriteActionAllowed",
    writeTarget: "finance-expense-mutations.ts → RPC update_expense_transaction",
    publisher: "emitFinanceExpenseUpdated",
    audit: "tryLogAuditEvent + activity_logs receipt path",
    futureHandler: "notification-finance-bridge",
    runtimeImpact: "medium",
    approvalReadiness: "auto",
  },
  {
    mutationAction: FINANCE_WRITE_ACTIONS.JOURNAL_POST,
    registryEnabled: false,
    requiresApproval: true,
    activationPhase: "prepare_p4_2",
    gate: "assertFinanceWriteActionAllowed → assertErpMutationApprovalGate",
    writeTarget: "RPC post_finance_journal_batch (SQL 047/052) — pas exposé TS",
    publisher: "emitFinanceTransactionRecorded | emitFinanceTransactionFailed",
    audit: "recordApprovalEngineAudit + governance_audit_events",
    futureHandler: "notification-approval-bridge + finance-bridge",
    runtimeImpact: "high",
    approvalReadiness: "approval_ready",
  },
  {
    mutationAction: FINANCE_WRITE_ACTIONS.INVOICE_ISSUE,
    registryEnabled: false,
    requiresApproval: false,
    activationPhase: "future",
    gate: "assertFinanceWriteActionAllowed",
    writeTarget: "finance_ar_invoices (read-only TS today)",
    publisher: "emitFinanceInvoiceIssued (taxonomy future)",
    audit: "recordFinanceGovernanceAudit",
    futureHandler: "notification-finance-bridge",
    runtimeImpact: "high",
    approvalReadiness: "future_approval",
  },
  {
    mutationAction: FINANCE_WRITE_ACTIONS.PAYMENT_ALLOCATE,
    registryEnabled: false,
    requiresApproval: false,
    activationPhase: "prepare_p4_2",
    gate: "assertFinanceWriteActionAllowed",
    writeTarget: "finance_payment_allocations + financial_transactions link",
    publisher: "emitFinancePaymentRecorded",
    audit: "recordFinanceGovernanceAudit",
    futureHandler: "notification-finance-bridge, treasury KPI refresh",
    runtimeImpact: "high",
    approvalReadiness: "approval_ready",
  },
] as const;

export const FINANCE_WRITE_ACTIVATION_SUMMARY = {
  totalMutations: FINANCE_WRITE_ACTIVATION_TABLE.length,
  enabledCount: FINANCE_WRITE_ACTIVATION_TABLE.filter((r) => r.registryEnabled).length,
  firstActivationTarget: FINANCE_WRITE_ACTIONS.EXPENSE_CREATE,
  activationRule:
    "registry.enabled=true UNIQUEMENT après câblage gate+write+publisher+audit validé en test",
} as const;
