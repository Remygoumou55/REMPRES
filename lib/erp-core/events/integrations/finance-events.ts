/**
 * Finance publishers — Bloc 3 maturity (expenses, transactions, approvals, reporting).
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const FINANCE_DEPARTMENT_KEY = "FINANCE" as const;

export async function emitFinanceExpenseCreated(params: {
  actorUserId: string;
  expenseId: string;
  amountGnf: number;
  categoryId: string;
  categoryName?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: "expenses",
    entityId: params.expenseId,
    correlationId: params.expenseId,
    payload: {
      expense_id: params.expenseId,
      amount_gnf: params.amountGnf,
      category_id: params.categoryId,
      category: params.categoryName ?? null,
      status: "active",
    },
  });
}

export async function emitFinanceExpenseUpdated(params: {
  actorUserId: string;
  expenseId: string;
  amountGnf: number;
  categoryId: string;
  fromAmountGnf?: number | null;
  categoryName?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: "expenses",
    entityId: params.expenseId,
    correlationId: params.expenseId,
    payload: {
      expense_id: params.expenseId,
      amount_gnf: params.amountGnf,
      category_id: params.categoryId,
      category: params.categoryName ?? null,
      from_amount_gnf: params.fromAmountGnf ?? null,
    },
  });
}

export async function emitFinanceTransactionRecorded(params: {
  actorUserId: string;
  transactionId: string;
  sourceType: string;
  sourceId: string;
  amountGnf: number;
  status?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: "financial_transactions",
    entityId: params.transactionId,
    correlationId: params.transactionId,
    payload: {
      transaction_id: params.transactionId,
      source_type: params.sourceType,
      source_id: params.sourceId,
      amount_gnf: params.amountGnf,
      status: params.status ?? "paid",
    },
  });
}

export async function emitFinanceTransactionUpdated(params: {
  actorUserId: string;
  transactionId: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  amountGnf?: number | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_UPDATED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: "financial_transactions",
    entityId: params.transactionId,
    correlationId: params.transactionId,
    payload: {
      transaction_id: params.transactionId,
      from_status: params.fromStatus ?? null,
      to_status: params.toStatus ?? null,
      amount_gnf: params.amountGnf ?? null,
    },
  });
}

export async function emitFinancePaymentRecorded(params: {
  actorUserId: string;
  paymentId: string;
  amountGnf: number;
  direction?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: "finance_payment_allocations",
    entityId: params.paymentId,
    correlationId: params.paymentId,
    payload: {
      payment_id: params.paymentId,
      amount_gnf: params.amountGnf,
      direction: params.direction ?? null,
    },
  });
}

export async function emitFinanceTransactionFailed(params: {
  actorUserId: string;
  entityType: string;
  entityId: string;
  reason: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: params.entityType,
    entityId: params.entityId,
    correlationId: params.entityId,
    payload: { reason: params.reason },
  });
}

export async function emitFinanceThresholdExceeded(params: {
  actorUserId?: string | null;
  thresholdKey: string;
  thresholdGnf: number;
  actualGnf: number;
  period?: string | null;
  kpiSource?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED, {
    actorUserId: params.actorUserId ?? null,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: "finance_threshold",
    entityId: params.thresholdKey,
    correlationId: params.thresholdKey,
    payload: {
      threshold_key: params.thresholdKey,
      threshold_gnf: params.thresholdGnf,
      actual_gnf: params.actualGnf,
      period: params.period ?? null,
      kpi_source: params.kpiSource ?? "finance-treasury-runtime-v1",
    },
  });
}

export async function emitFinanceApprovalRequested(params: {
  actorUserId: string;
  entityType: string;
  entityId: string;
  approvalRequestId: string;
  reason?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_APPROVAL_REQUESTED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: params.entityType,
    entityId: params.entityId,
    correlationId: params.entityId,
    causationId: params.approvalRequestId,
    payload: {
      approval_request_id: params.approvalRequestId,
      reason: params.reason ?? null,
    },
  });
}

export async function emitFinanceApprovalApproved(params: {
  actorUserId: string;
  entityType: string;
  entityId: string;
  approvalRequestId?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_APPROVAL_APPROVED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: params.entityType,
    entityId: params.entityId,
    correlationId: params.entityId,
    causationId: params.approvalRequestId ?? undefined,
    payload: { approval_request_id: params.approvalRequestId ?? null },
  });
}

export async function emitFinanceApprovalRejected(params: {
  actorUserId: string;
  entityType: string;
  entityId: string;
  rejectionReason?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_APPROVAL_REJECTED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: params.entityType,
    entityId: params.entityId,
    correlationId: params.entityId,
    payload: { rejection_reason: params.rejectionReason ?? null },
  });
}

export async function emitFinanceReportGenerated(params: {
  actorUserId: string;
  reportId: string;
  reportType: string;
  periodFrom: string;
  periodTo: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.FINANCE_REPORT_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: FINANCE_DEPARTMENT_KEY,
    entityType: "finance_report",
    entityId: params.reportId,
    correlationId: params.reportId,
    payload: {
      report_id: params.reportId,
      report_type: params.reportType,
      period_from: params.periodFrom,
      period_to: params.periodTo,
    },
  });
}
