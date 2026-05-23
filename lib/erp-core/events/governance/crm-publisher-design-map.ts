/**
 * P1 — Design map publishers CRM (1 publisher = 1 responsabilité).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const CRM_PUBLISHER_DESIGN_MAP_VERSION = "crm-publisher-design-p1-v1" as const;

export type CrmPublisherDesignEntry = {
  publisher: string;
  eventType: string;
  entityType: string;
  family: "domain" | "mutation" | "runtime";
  sensitivity: "internal";
  owner: "vente-crm";
  payloadKeys: readonly string[];
  correlationId: string;
  wirePhase: "active" | "publisher_ready";
  mutationAction: string | null;
};

export const CRM_PUBLISHER_DESIGN_MAP: readonly CrmPublisherDesignEntry[] = [
  {
    publisher: "emitCrmLeadCreated",
    eventType: OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED,
    entityType: "crm_leads",
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
    payloadKeys: ["status", "company_name", "estimated_value_gnf"],
    correlationId: "leadId",
    wirePhase: "active",
    mutationAction: "crm.lead.create",
  },
  {
    publisher: "emitCrmQuoteCreated",
    eventType: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CREATED,
    entityType: "crm_quotes",
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
    payloadKeys: ["quote_number", "client_id", "status"],
    correlationId: "quoteId",
    wirePhase: "active",
    mutationAction: "crm.quote.create",
  },
  {
    publisher: "emitCrmQuoteStatusUpdated",
    eventType: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_STATUS_UPDATED,
    entityType: "crm_quotes",
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
    payloadKeys: ["from_status", "to_status", "quote_number"],
    correlationId: "quoteId",
    wirePhase: "active",
    mutationAction: "crm.quote.update_status",
  },
  {
    publisher: "emitCrmQuoteConvertRequested",
    eventType: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERT_REQUESTED,
    entityType: "crm_quote",
    family: "mutation",
    sensitivity: "internal",
    owner: "vente-crm",
    payloadKeys: ["amount_gnf"],
    correlationId: "quoteId",
    wirePhase: "active",
    mutationAction: "crm.quote.convert_sale",
  },
  {
    publisher: "emitCrmQuoteConverted",
    eventType: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED,
    entityType: "crm_quote",
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
    payloadKeys: ["sale_id", "sale_reference"],
    correlationId: "quoteId",
    wirePhase: "active",
    mutationAction: "crm.quote.convert_sale",
  },
  {
    publisher: "emitRuntimeOrchestrationFailed",
    eventType: OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_FAILED,
    entityType: "crm_quote",
    family: "runtime",
    sensitivity: "internal",
    owner: "vente-crm",
    payloadKeys: ["orchestration", "failure_code", "message"],
    correlationId: "quoteId",
    wirePhase: "active",
    mutationAction: "crm.quote.convert_sale",
  },
] as const;
