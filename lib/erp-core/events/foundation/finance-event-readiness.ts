/**
 * B3.2+ — Readiness événements Finance (pas d'activation writes).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const FINANCE_ACTIONS = {
  EXPENSE_CREATE: "finance.expense.create",
  EXPENSE_UPDATE: "finance.expense.update",
  JOURNAL_POST: "finance.journal.post",
  INVOICE_ISSUE: "finance.invoice.issue",
  PAYMENT_ALLOCATE: "finance.payment.allocate",
} as const;

export const FINANCE_EVENT_READINESS_VERSION = "finance-event-readiness-b3.2-plus-v1" as const;

export type FinanceEventReadinessRow = {
  writeAction: string;
  registryEnabled: boolean;
  requiresApproval: boolean;
  plannedDomainEvent: string;
  plannedPublisher: string;
  readiness: "blocked_registry" | "ready_when_writes_enabled";
};

export const FINANCE_EVENT_READINESS_TABLE: readonly FinanceEventReadinessRow[] = [
  {
    writeAction: FINANCE_ACTIONS.EXPENSE_CREATE,
    registryEnabled: false,
    requiresApproval: false,
    plannedDomainEvent: "finance.expense.created",
    plannedPublisher: "emitFinanceExpenseCreated",
    readiness: "blocked_registry",
  },
  {
    writeAction: FINANCE_ACTIONS.EXPENSE_UPDATE,
    registryEnabled: false,
    requiresApproval: false,
    plannedDomainEvent: "finance.expense.updated",
    plannedPublisher: "emitFinanceExpenseUpdated",
    readiness: "blocked_registry",
  },
  {
    writeAction: FINANCE_ACTIONS.JOURNAL_POST,
    registryEnabled: false,
    requiresApproval: true,
    plannedDomainEvent: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    plannedPublisher: "emitFinanceTransactionRecorded",
    readiness: "blocked_registry",
  },
  {
    writeAction: FINANCE_ACTIONS.INVOICE_ISSUE,
    registryEnabled: false,
    requiresApproval: false,
    plannedDomainEvent: "finance.invoice.issued",
    plannedPublisher: "emitFinanceInvoiceIssued",
    readiness: "blocked_registry",
  },
  {
    writeAction: FINANCE_ACTIONS.PAYMENT_ALLOCATE,
    registryEnabled: false,
    requiresApproval: false,
    plannedDomainEvent: "finance.payment.allocated",
    plannedPublisher: "emitFinancePaymentAllocated",
    readiness: "blocked_registry",
  },
] as const;

export const FINANCE_EVENT_READINESS_SUMMARY = {
  officialCatalogSlot: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
  integrationFileFuture: "lib/erp-core/events/integrations/finance-events.ts",
  departmentKey: "FINANCE",
  kpiSource: "finance-treasury-runtime-v1",
  writesEnabled: false,
  gateReady: true,
} as const;
