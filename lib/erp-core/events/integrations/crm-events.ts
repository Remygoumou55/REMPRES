/**
 * B3.2 — Publishers officiels — CRM / Vente (orchestration runtime).
 * Bloc 3 — bus complet lifecycle + pipeline + activités + reporting.
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const CRM_DEPARTMENT_KEY = "VENTE" as const;

export async function emitCrmLeadCreated(params: {
  actorUserId: string;
  leadId: string;
  status?: string | null;
  companyName?: string | null;
  estimatedValueGnf?: number | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_leads",
    entityId: params.leadId,
    correlationId: params.leadId,
    payload: {
      status: params.status ?? "new",
      company_name: params.companyName ?? null,
      estimated_value_gnf: params.estimatedValueGnf ?? null,
    },
  });
}

export async function emitCrmLeadUpdated(params: {
  actorUserId: string;
  leadId: string;
  fromStatus: string;
  toStatus: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_UPDATED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_leads",
    entityId: params.leadId,
    correlationId: params.leadId,
    payload: {
      from_status: params.fromStatus,
      to_status: params.toStatus,
    },
  });
}

export async function emitCrmLeadConverted(params: {
  actorUserId: string;
  leadId: string;
  clientId: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CONVERTED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_leads",
    entityId: params.leadId,
    correlationId: params.leadId,
    causationId: params.clientId,
    payload: { client_id: params.clientId },
  });
}

export async function emitCrmDealCreated(params: {
  actorUserId: string;
  opportunityId: string;
  title: string;
  stageId: string;
  amountEstimatedGnf: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_opportunities",
    entityId: params.opportunityId,
    correlationId: params.opportunityId,
    payload: {
      title: params.title,
      stage_id: params.stageId,
      amount_estimated_gnf: params.amountEstimatedGnf,
    },
  });
}

export async function emitCrmPipelineUpdated(params: {
  actorUserId: string;
  opportunityId: string;
  fromStageId: string;
  toStageId: string;
  stageCode?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_PIPELINE_UPDATED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_opportunities",
    entityId: params.opportunityId,
    correlationId: params.opportunityId,
    payload: {
      from_stage_id: params.fromStageId,
      to_stage_id: params.toStageId,
      stage_code: params.stageCode ?? null,
    },
  });
}

export async function emitCrmDealWon(params: {
  actorUserId: string;
  opportunityId: string;
  amountGnf: number;
  stageCode?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_WON, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_opportunities",
    entityId: params.opportunityId,
    correlationId: params.opportunityId,
    payload: {
      amount_gnf: params.amountGnf,
      stage_code: params.stageCode ?? null,
    },
  });
}

export async function emitCrmDealLost(params: {
  actorUserId: string;
  opportunityId: string;
  lostReason?: string | null;
  stageCode?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_LOST, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_opportunities",
    entityId: params.opportunityId,
    correlationId: params.opportunityId,
    payload: {
      lost_reason: params.lostReason ?? null,
      stage_code: params.stageCode ?? null,
    },
  });
}

export async function emitCrmActivityCreated(params: {
  actorUserId: string;
  activityId: string;
  activityType: string;
  subject: string;
  relatedKind: string;
  relatedId: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_ACTIVITY_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_activities",
    entityId: params.activityId,
    correlationId: params.activityId,
    payload: {
      activity_type: params.activityType,
      subject: params.subject,
      related_kind: params.relatedKind,
      related_id: params.relatedId,
    },
  });
}

export async function emitCrmActivityCompleted(params: {
  actorUserId: string;
  activityId: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_ACTIVITY_COMPLETED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_activities",
    entityId: params.activityId,
    correlationId: params.activityId,
    payload: {},
  });
}

export async function emitCrmReportGenerated(params: {
  actorUserId: string;
  reportId: string;
  reportType: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_REPORT_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_report",
    entityId: params.reportId,
    correlationId: params.reportId,
    payload: { report_type: params.reportType },
  });
}

export async function emitCrmQuoteCreated(params: {
  actorUserId: string;
  quoteId: string;
  quoteNumber?: string | null;
  clientId: string;
  status?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_quotes",
    entityId: params.quoteId,
    correlationId: params.quoteId,
    payload: {
      quote_number: params.quoteNumber ?? null,
      client_id: params.clientId,
      status: params.status ?? "draft",
    },
  });
}

export async function emitCrmQuoteStatusUpdated(params: {
  actorUserId: string;
  quoteId: string;
  fromStatus: string;
  toStatus: string;
  quoteNumber?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_STATUS_UPDATED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_quotes",
    entityId: params.quoteId,
    correlationId: params.quoteId,
    payload: {
      from_status: params.fromStatus,
      to_status: params.toStatus,
      quote_number: params.quoteNumber ?? null,
    },
  });
}

export async function emitCrmQuoteConvertRequested(params: {
  actorUserId: string;
  quoteId: string;
  amountGnf?: number | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERT_REQUESTED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
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
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
    entityType: "crm_quote",
    entityId: params.quoteId,
    correlationId: params.quoteId,
    causationId: params.saleId,
    payload: {
      sale_id: params.saleId,
      sale_reference: params.saleReference ?? null,
    },
  });

  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_COMPLETED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
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
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_FAILED, {
    actorUserId: params.actorUserId,
    departmentKey: CRM_DEPARTMENT_KEY,
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
