/**
 * B3.2+ — Plan migration CRM → bus (gouverné, sans rewrite).
 */

/** Valeurs alignées sur CRM_WRITE_ACTIONS — literals pour éviter import gate en tests/docs. */
const CRM_ACTIONS = {
  LEAD_CREATE: "crm.lead.create",
  LEAD_UPDATE_STATUS: "crm.lead.update_status",
  LEAD_CONVERT: "crm.lead.convert",
  OPPORTUNITY_CREATE: "crm.opportunity.create",
  OPPORTUNITY_UPDATE_STAGE: "crm.opportunity.update_stage",
  QUOTE_CREATE: "crm.quote.create",
  QUOTE_UPDATE_STATUS: "crm.quote.update_status",
  QUOTE_CONVERT_SALE: "crm.quote.convert_sale",
  ACTIVITY_CREATE: "crm.activity.create",
  ACTIVITY_COMPLETE: "crm.activity.complete",
} as const;

export const CRM_EVENT_MIGRATION_PLAN_VERSION = "crm-event-migration-p1-v1" as const;

export type CrmMigrationLegacyEffect = "audit_only" | "audit_and_gate" | "audit_gate_rpc_event";

export type CrmEventMigrationRow = {
  mutationAction: string;
  legacyEffects: CrmMigrationLegacyEffect;
  legacyAudit: "recordCrmGovernanceAudit";
  legacyAlert: "none" | "via_mutation_gate_only";
  futurePublisher: string;
  futureDomainEvent: string | null;
  futureMutationEvent: string | null;
  migrationPhase: "done" | "publisher_ready" | "later";
  notes: string;
};

export const CRM_EVENT_MIGRATION_TABLE: readonly CrmEventMigrationRow[] = [
  {
    mutationAction: CRM_ACTIONS.QUOTE_CONVERT_SALE,
    legacyEffects: "audit_gate_rpc_event",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "via_mutation_gate_only",
    futurePublisher: "emitCrmQuoteConverted (+ approval publishers)",
    futureDomainEvent: "crm.quote.converted",
    futureMutationEvent: "crm.quote.convert_requested",
    migrationPhase: "done",
    notes: "B3.3a — convert_requested + orchestration.failed branchés.",
  },
  {
    mutationAction: CRM_ACTIONS.LEAD_CREATE,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmLeadCreated",
    futureDomainEvent: "crm.lead.created",
    futureMutationEvent: null,
    migrationPhase: "done",
    notes: "P1.1 — emitCrmLeadCreated câblé.",
  },
  {
    mutationAction: CRM_ACTIONS.LEAD_UPDATE_STATUS,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmLeadStatusUpdated",
    futureDomainEvent: "crm.lead.status_updated",
    futureMutationEvent: null,
    migrationPhase: "later",
    notes: "Taxonomy P2 — hors scope P1 minimum.",
  },
  {
    mutationAction: CRM_ACTIONS.LEAD_CONVERT,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmLeadConverted",
    futureDomainEvent: "crm.lead.converted",
    futureMutationEvent: null,
    migrationPhase: "later",
    notes: "",
  },
  {
    mutationAction: CRM_ACTIONS.OPPORTUNITY_CREATE,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmOpportunityCreated",
    futureDomainEvent: "crm.opportunity.created",
    futureMutationEvent: null,
    migrationPhase: "later",
    notes: "",
  },
  {
    mutationAction: CRM_ACTIONS.OPPORTUNITY_UPDATE_STAGE,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmOpportunityStageUpdated",
    futureDomainEvent: "crm.opportunity.stage_updated",
    futureMutationEvent: null,
    migrationPhase: "later",
    notes: "",
  },
  {
    mutationAction: CRM_ACTIONS.QUOTE_CREATE,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmQuoteCreated",
    futureDomainEvent: "crm.quote.created",
    futureMutationEvent: null,
    migrationPhase: "done",
    notes: "P1.1 — emitCrmQuoteCreated câblé.",
  },
  {
    mutationAction: CRM_ACTIONS.QUOTE_UPDATE_STATUS,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmQuoteStatusUpdated",
    futureDomainEvent: "crm.quote.status_updated",
    futureMutationEvent: null,
    migrationPhase: "done",
    notes: "P1.1 — emitCrmQuoteStatusUpdated câblé.",
  },
  {
    mutationAction: CRM_ACTIONS.ACTIVITY_CREATE,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmActivityCreated",
    futureDomainEvent: "crm.activity.created",
    futureMutationEvent: null,
    migrationPhase: "later",
    notes: "",
  },
  {
    mutationAction: CRM_ACTIONS.ACTIVITY_COMPLETE,
    legacyEffects: "audit_only",
    legacyAudit: "recordCrmGovernanceAudit",
    legacyAlert: "none",
    futurePublisher: "emitCrmActivityCompleted",
    futureDomainEvent: "crm.activity.completed",
    futureMutationEvent: null,
    migrationPhase: "later",
    notes: "",
  },
] as const;
