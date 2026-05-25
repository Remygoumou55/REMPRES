/**
 * Operations + Project domain governance — Bloc 3 Étape 5.
 */
export const OPERATIONS_DOMAIN_GOVERNANCE_VERSION = "operations-domain-governance-bloc3-v1" as const;

export const OPERATIONS_DOMAIN_GOVERNANCE = {
  version: OPERATIONS_DOMAIN_GOVERNANCE_VERSION,
  departmentKey: "CONSULTATION",
  moduleKey: "operations",
  taskSoT: "erp_ops_tasks",
  workflowSoT: "erp_ops_workflows",
  projectSoT: "erp_ops_projects",
  deliverySoT: "erp_ops_deliveries",
  eventOwner: "operations",
} as const;

export const OPERATIONS_CAPABILITY_STATUS = {
  taskEngine: "active",
  workflowEngine: "active",
  projectGovernance: "active",
  deliveryTracking: "active",
  orchestration: "active",
  events: "active",
  cockpit: "active",
} as const;
