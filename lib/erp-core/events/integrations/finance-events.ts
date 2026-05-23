/**
 * P4.1 — Publishers officiels Finance (dépenses — gate activé sur create/update).
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
      from_status: "recorded",
      to_status: "updated",
      from_amount_gnf: params.fromAmountGnf ?? null,
    },
  });
}
