/**
 * P4 — Readiness événements Finance (catalogue étendu ; writes toujours bloqués).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const FINANCE_WRITE_ACTIONS = {
  EXPENSE_CREATE: "finance.expense.create",
  EXPENSE_UPDATE: "finance.expense.update",
  JOURNAL_POST: "finance.journal.post",
  INVOICE_ISSUE: "finance.invoice.issue",
  PAYMENT_ALLOCATE: "finance.payment.allocate",
} as const;

export const FINANCE_EVENT_READINESS_VERSION = "finance-event-readiness-p4-v1" as const;

export type FinanceEventReadinessRow = {
  writeAction: string;
  registryEnabled: boolean;
  requiresApproval: boolean;
  plannedDomainEvent: string;
  plannedPublisher: string;
  officialCatalog: boolean;
  readiness: "blocked_registry" | "ready_when_writes_enabled";
};

export const FINANCE_EVENT_READINESS_TABLE: readonly FinanceEventReadinessRow[] = [
  {
    writeAction: FINANCE_WRITE_ACTIONS.EXPENSE_CREATE,
    registryEnabled: true,
    requiresApproval: false,
    plannedDomainEvent: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
    plannedPublisher: "emitFinanceExpenseCreated",
    officialCatalog: true,
    readiness: "ready_when_writes_enabled",
  },
  {
    writeAction: FINANCE_WRITE_ACTIONS.EXPENSE_UPDATE,
    registryEnabled: true,
    requiresApproval: false,
    plannedDomainEvent: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED,
    plannedPublisher: "emitFinanceExpenseUpdated",
    officialCatalog: true,
    readiness: "ready_when_writes_enabled",
  },
  {
    writeAction: FINANCE_WRITE_ACTIONS.JOURNAL_POST,
    registryEnabled: false,
    requiresApproval: true,
    plannedDomainEvent: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    plannedPublisher: "emitFinanceTransactionRecorded",
    officialCatalog: true,
    readiness: "blocked_registry",
  },
  {
    writeAction: FINANCE_WRITE_ACTIONS.INVOICE_ISSUE,
    registryEnabled: false,
    requiresApproval: false,
    plannedDomainEvent: "finance.invoice.issued",
    plannedPublisher: "emitFinanceInvoiceIssued",
    officialCatalog: false,
    readiness: "blocked_registry",
  },
  {
    writeAction: FINANCE_WRITE_ACTIONS.PAYMENT_ALLOCATE,
    registryEnabled: false,
    requiresApproval: false,
    plannedDomainEvent: OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED,
    plannedPublisher: "emitFinancePaymentRecorded",
    officialCatalog: true,
    readiness: "blocked_registry",
  },
] as const;

export const FINANCE_OFFICIAL_EVENT_SLOTS = [
  OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
  OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED,
  OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
  OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED,
  OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
  OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED,
] as const;

export const FINANCE_EVENT_READINESS_SUMMARY = {
  readinessVersion: FINANCE_EVENT_READINESS_VERSION,
  officialCatalogSlots: FINANCE_OFFICIAL_EVENT_SLOTS,
  officialFinanceTypeCount: FINANCE_OFFICIAL_EVENT_SLOTS.length,
  integrationFileFuture: "lib/erp-core/events/integrations/finance-events.ts",
  departmentKey: "FINANCE",
  kpiSource: "finance-treasury-runtime-v1",
  writesEnabled: true,
  writesEnabledScope: "finance.expense.create|finance.expense.update",
  gateReady: true,
  p4GovernanceReady: true,
  writeActivationReady: true,
  writeActivationScope: "expense_mutations_only",
} as const;
