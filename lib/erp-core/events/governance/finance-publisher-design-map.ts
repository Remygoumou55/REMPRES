/**
 * P4 — Design map publishers Finance (1 publisher = 1 responsabilité).
 * Implémentation `finance-events.ts` = phase P4.1 — pas de câblage sauvage.
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const EXPENSE_CREATED = OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED;
const EXPENSE_UPDATED = OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED;

export const FINANCE_PUBLISHER_DESIGN_MAP_VERSION = "finance-publisher-design-p4-v1" as const;

export type FinancePublisherDesignEntry = {
  publisher: string;
  eventType: string;
  entityType: string;
  family: "domain";
  sensitivity: "restricted";
  owner: "finance";
  payloadKeys: readonly string[];
  correlationId: string;
  causationId: string | null;
  wirePhase: "publisher_ready" | "active";
  mutationAction: string | null;
  traceability: "integration_publish_defaults";
  security: string;
};

export const FINANCE_PUBLISHER_DESIGN_MAP: readonly FinancePublisherDesignEntry[] = [
  {
    publisher: "emitFinanceTransactionRecorded",
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    entityType: "financial_transactions",
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    payloadKeys: [
      "source_type",
      "amount_gnf",
      "status",
      "reference",
      "mutation_action",
    ],
    correlationId: "transactionId",
    causationId: "journalBatchId",
    wirePhase: "publisher_ready",
    mutationAction: "finance.journal.post",
    traceability: "integration_publish_defaults",
    security: "assertFinanceRuntimeWriteAccess + registry gate",
  },
  {
    publisher: "emitFinanceTransactionFailed",
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED,
    entityType: "financial_transactions",
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    payloadKeys: ["failure_code", "message", "mutation_action", "source_type"],
    correlationId: "transactionId",
    causationId: "journalBatchId",
    wirePhase: "publisher_ready",
    mutationAction: "finance.journal.post",
    traceability: "integration_publish_defaults",
    security: "assertFinanceRuntimeWriteAccess + registry gate",
  },
  {
    publisher: "emitFinanceThresholdExceeded",
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    entityType: "finance_threshold",
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    payloadKeys: [
      "threshold_key",
      "threshold_gnf",
      "actual_gnf",
      "period",
      "kpi_source",
    ],
    correlationId: "thresholdKey",
    causationId: null,
    wirePhase: "active",
    mutationAction: null,
    traceability: "integration_publish_defaults",
    security: "assertFinanceRuntimeReadAccess (émission runtime KPI)",
  },
  {
    publisher: "emitFinancePaymentRecorded",
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED,
    entityType: "finance_payment_allocations",
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    payloadKeys: [
      "payment_id",
      "amount_gnf",
      "allocation_target_type",
      "allocation_target_id",
    ],
    correlationId: "paymentId",
    causationId: "invoiceId",
    wirePhase: "publisher_ready",
    mutationAction: "finance.payment.allocate",
    traceability: "integration_publish_defaults",
    security: "assertFinanceRuntimeWriteAccess + registry gate",
  },
  {
    publisher: "emitFinanceExpenseCreated",
    eventType: EXPENSE_CREATED,
    entityType: "expenses",
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    payloadKeys: ["expense_id", "amount_gnf", "category_id", "category", "status"],
    correlationId: "expenseId",
    causationId: null,
    wirePhase: "active",
    mutationAction: "finance.expense.create",
    traceability: "integration_publish_defaults",
    security: "assertFinanceRuntimeWriteAccess + registry gate",
  },
  {
    publisher: "emitFinanceExpenseUpdated",
    eventType: EXPENSE_UPDATED,
    entityType: "expenses",
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    payloadKeys: [
      "expense_id",
      "from_status",
      "to_status",
      "amount_gnf",
      "from_amount_gnf",
      "category_id",
      "category",
    ],
    correlationId: "expenseId",
    causationId: null,
    wirePhase: "active",
    mutationAction: "finance.expense.update",
    traceability: "integration_publish_defaults",
    security: "assertFinanceRuntimeWriteAccess + registry gate",
  },
] as const;
