/**
 * P1 — Plan d'intégration mutations CRM → bus (câblage = P1.1).
 */

export const CRM_MUTATION_INTEGRATION_PLAN_VERSION = "crm-mutation-integration-p1-v1" as const;

export type CrmMutationIntegrationRow = {
  mutationFunction: string;
  mutationAction: string;
  eventType: string;
  publisher: string;
  wireAfter: "db_success_before_audit";
  futureHandler: string;
  integrationPhase: "done" | "p1_ready" | "later";
};

export const CRM_MUTATION_INTEGRATION_TABLE: readonly CrmMutationIntegrationRow[] = [
  {
    mutationFunction: "convertCrmQuoteToSale",
    mutationAction: "crm.quote.convert_sale",
    eventType: "crm.quote.convert_requested + converted + runtime.*",
    publisher: "emitCrmQuoteConvertRequested, emitCrmQuoteConverted, emitRuntimeOrchestrationFailed",
    wireAfter: "db_success_before_audit",
    futureHandler: "notification-approval-bridge, cockpit-vente-refresh",
    integrationPhase: "done",
  },
  {
    mutationFunction: "createCrmLead",
    mutationAction: "crm.lead.create",
    eventType: "crm.lead.created",
    publisher: "emitCrmLeadCreated",
    wireAfter: "db_success_before_audit",
    futureHandler: "notification-crm-lead, cockpit-vente-refresh",
    integrationPhase: "done",
  },
  {
    mutationFunction: "createCrmQuote",
    mutationAction: "crm.quote.create",
    eventType: "crm.quote.created",
    publisher: "emitCrmQuoteCreated",
    wireAfter: "db_success_before_audit",
    futureHandler: "notification-crm-quote, cockpit-vente-refresh",
    integrationPhase: "done",
  },
  {
    mutationFunction: "updateCrmQuoteStatus",
    mutationAction: "crm.quote.update_status",
    eventType: "crm.quote.status_updated",
    publisher: "emitCrmQuoteStatusUpdated",
    wireAfter: "db_success_before_audit",
    futureHandler: "notification-crm-quote-status, automation-quote-accepted",
    integrationPhase: "done",
  },
  {
    mutationFunction: "updateCrmLeadStatus",
    mutationAction: "crm.lead.update_status",
    eventType: "crm.lead.status_updated",
    publisher: "emitCrmLeadStatusUpdated (P2 taxonomy)",
    wireAfter: "db_success_before_audit",
    futureHandler: "notification-crm-lead",
    integrationPhase: "later",
  },
  {
    mutationFunction: "convertCrmLeadToClient",
    mutationAction: "crm.lead.convert",
    eventType: "crm.lead.converted",
    publisher: "emitCrmLeadConverted (P2)",
    wireAfter: "db_success_before_audit",
    futureHandler: "notification-crm-lead-convert",
    integrationPhase: "later",
  },
  {
    mutationFunction: "createCrmOpportunity",
    mutationAction: "crm.opportunity.create",
    eventType: "crm.opportunity.created",
    publisher: "emitCrmOpportunityCreated (P2)",
    wireAfter: "db_success_before_audit",
    futureHandler: "cockpit-vente-refresh",
    integrationPhase: "later",
  },
  {
    mutationFunction: "updateCrmOpportunityStage",
    mutationAction: "crm.opportunity.update_stage",
    eventType: "crm.opportunity.stage_updated",
    publisher: "emitCrmOpportunityStageUpdated (P2)",
    wireAfter: "db_success_before_audit",
    futureHandler: "automation-pipeline",
    integrationPhase: "later",
  },
  {
    mutationFunction: "createCrmActivity",
    mutationAction: "crm.activity.create",
    eventType: "crm.activity.created",
    publisher: "emitCrmActivityCreated (P2)",
    wireAfter: "db_success_before_audit",
    futureHandler: "notification-crm-activity",
    integrationPhase: "later",
  },
  {
    mutationFunction: "completeCrmActivity",
    mutationAction: "crm.activity.complete",
    eventType: "crm.activity.completed",
    publisher: "emitCrmActivityCompleted (P2)",
    wireAfter: "db_success_before_audit",
    futureHandler: "notification-crm-activity",
    integrationPhase: "later",
  },
] as const;

export const CRM_MUTATION_WIRING_RULE =
  "Appeler publisher après succès DB, avant recordCrmGovernanceAudit — conserver audit legacy en P1.1." as const;
