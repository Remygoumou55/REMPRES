/**
 * P4 — Plan d'intégration mutations Finance → bus (câblage = P4.1+).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const FINANCE_WRITE_ACTIONS = {
  EXPENSE_CREATE: "finance.expense.create",
  EXPENSE_UPDATE: "finance.expense.update",
  JOURNAL_POST: "finance.journal.post",
  INVOICE_ISSUE: "finance.invoice.issue",
  PAYMENT_ALLOCATE: "finance.payment.allocate",
} as const;

export const FINANCE_MUTATION_INTEGRATION_PLAN_VERSION = "finance-mutation-integration-p4-v1" as const;

export type FinanceMutationIntegrationRow = {
  mutationFunction: string;
  mutationAction: string;
  eventTypes: string;
  publisher: string;
  wireAfter: "gate_db_success_before_audit" | "kpi_compute_after_read";
  integrationPhase: "done" | "p4_ready" | "p4_1" | "p4_2" | "later";
  legacyPath: string;
  futureHandler: string;
};

export const FINANCE_MUTATION_INTEGRATION_TABLE: readonly FinanceMutationIntegrationRow[] = [
  {
    mutationFunction: "createExpense",
    mutationAction: FINANCE_WRITE_ACTIONS.EXPENSE_CREATE,
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
    publisher: "emitFinanceExpenseCreated",
    wireAfter: "gate_db_success_before_audit",
    integrationPhase: "done",
    legacyPath: "depenses/actions.ts → finance-expense-mutations.ts → expenses.ts RPC",
    futureHandler: "notification-finance-bridge",
  },
  {
    mutationFunction: "updateExpense",
    mutationAction: FINANCE_WRITE_ACTIONS.EXPENSE_UPDATE,
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED,
    publisher: "emitFinanceExpenseUpdated",
    wireAfter: "gate_db_success_before_audit",
    integrationPhase: "done",
    legacyPath: "depenses/actions.ts → finance-expense-mutations.ts",
    futureHandler: "notification-finance-bridge",
  },
  {
    mutationFunction: "deleteExpense",
    mutationAction: "finance.expense.delete",
    eventTypes: "finance.expense.deleted (taxonomy future)",
    publisher: "emitFinanceExpenseDeleted (future)",
    wireAfter: "gate_db_success_before_audit",
    integrationPhase: "later",
    legacyPath: "depenses/actions.ts",
    futureHandler: "notification-finance-bridge",
  },
  {
    mutationFunction: "createSale (sales.ts)",
    mutationAction: "finance.sale.record",
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    publisher: "emitFinanceTransactionRecorded",
    wireAfter: "gate_db_success_before_audit",
    integrationPhase: "p4_2",
    legacyPath: "lib/server/sales.ts → create_sale_transaction RPC",
    futureHandler: "treasury KPI refresh, vente cross-dept",
  },
  {
    mutationFunction: "postFinanceJournalBatch (RPC)",
    mutationAction: FINANCE_WRITE_ACTIONS.JOURNAL_POST,
    eventTypes: `${OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED} | ${OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED}`,
    publisher: "emitFinanceTransactionRecorded, emitFinanceTransactionFailed",
    wireAfter: "gate_db_success_before_audit",
    integrationPhase: "p4_2",
    legacyPath: "supabase/sql/047 — pas de server action TS",
    futureHandler: "notification-approval-bridge",
  },
  {
    mutationFunction: "allocatePayment (future)",
    mutationAction: FINANCE_WRITE_ACTIONS.PAYMENT_ALLOCATE,
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED,
    publisher: "emitFinancePaymentRecorded",
    wireAfter: "gate_db_success_before_audit",
    integrationPhase: "p4_2",
    legacyPath: "modules/finance/server — read-only today",
    futureHandler: "notification-finance-bridge",
  },
  {
    mutationFunction: "evaluateFinanceThresholds (runtime)",
    mutationAction: "finance.threshold.evaluate",
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    publisher: "emitFinanceThresholdExceeded",
    wireAfter: "kpi_compute_after_read",
    integrationPhase: "done",
    legacyPath: "lib/finance/runtime/finance-threshold-evaluator.ts",
    futureHandler: "notification-finance-bridge + erp-automation-engine",
  },
] as const;

export const FINANCE_MUTATION_INTEGRATION_ORDER = [
  "1. assertFinanceWriteActionAllowed (registry enabled)",
  "2. write DB / RPC",
  "3. publishIntegrationOfficialEvent (finance-events.ts)",
  "4. recordFinanceGovernanceAudit ou tryLogAuditEvent legacy (coexistence)",
  "5. revalidateFinanceScope / cockpit",
] as const;
