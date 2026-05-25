/**
 * CRM domain governance — Bloc 3 Étape 3.
 */
export const CRM_DOMAIN_GOVERNANCE_VERSION = "crm-domain-governance-bloc3-v1" as const;

export const CRM_DOMAIN_GOVERNANCE = {
  version: CRM_DOMAIN_GOVERNANCE_VERSION,
  departmentKey: "VENTE",
  dealEntity: "crm_opportunities",
  leadEntity: "crm_leads",
  ownershipField: "owner_id",
  eventOwner: "vente-crm",
} as const;

/** Règles ownership — création assigne owner_id = acteur ; transfert = phase ultérieure. */
export const CRM_OWNERSHIP_RULES = {
  leadCreateAssignsOwner: true,
  opportunityCreateAssignsOwner: true,
  activityCreateAssignsOwner: true,
  quoteConvertRequiresApproval: true,
} as const;

export const CRM_CAPABILITY_STATUS = {
  leadLifecycle: "active",
  pipeline: "active",
  dealGovernance: "active",
  activities: "active",
  analytics: "active",
  events: "active",
  territoryTransfer: "planned",
} as const;
