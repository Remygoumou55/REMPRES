/**
 * B3.2 — Publishers officiels — CRM / Vente (orchestration runtime).
 */

import { publishOfficialErpEvent } from "@/lib/erp-core/events/event-bus";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export async function emitCrmQuoteConvertRequested(params: {
  actorUserId: string;
  quoteId: string;
  amountGnf?: number | null;
}): Promise<void> {
  await publishOfficialErpEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERT_REQUESTED, {
    actorUserId: params.actorUserId,
    departmentKey: "VENTE",
    entityType: "crm_quote",
    entityId: params.quoteId,
    correlationId: params.quoteId,
    payload: { amount_gnf: params.amountGnf ?? null },
  });
}

export async function emitCrmQuoteConverted(params: {
  actorUserId: string;
  quoteId: string;
  saleId: string;
  saleReference?: string | null;
}): Promise<void> {
  await publishOfficialErpEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED, {
    actorUserId: params.actorUserId,
    departmentKey: "VENTE",
    entityType: "crm_quote",
    entityId: params.quoteId,
    correlationId: params.quoteId,
    causationId: params.saleId,
    payload: {
      sale_id: params.saleId,
      sale_reference: params.saleReference ?? null,
    },
  });

  await publishOfficialErpEvent(OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_COMPLETED, {
    actorUserId: params.actorUserId,
    departmentKey: "VENTE",
    entityType: "sales",
    entityId: params.saleId,
    correlationId: params.quoteId,
    causationId: params.saleId,
    payload: { orchestration: "crm.quote.convert_sale" },
  });
}

const QUOTE_CONVERT_ORCHESTRATION = "crm.quote.convert_sale" as const;

export async function emitRuntimeOrchestrationFailed(params: {
  actorUserId: string;
  quoteId: string;
  failureCode: string;
  message?: string | null;
  orchestration?: string;
}): Promise<void> {
  await publishOfficialErpEvent(OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_FAILED, {
    actorUserId: params.actorUserId,
    departmentKey: "VENTE",
    entityType: "crm_quote",
    entityId: params.quoteId,
    correlationId: params.quoteId,
    payload: {
      orchestration: params.orchestration ?? QUOTE_CONVERT_ORCHESTRATION,
      failure_code: params.failureCode,
      message: params.message ?? null,
    },
  });
}
