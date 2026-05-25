/**
 * Automation + AI orchestration domain governance — Bloc 3 Étape 7.
 */
export const AUTOMATION_DOMAIN_GOVERNANCE_VERSION = "automation-domain-governance-bloc3-v1" as const;

export const AUTOMATION_DOMAIN_GOVERNANCE = {
  version: AUTOMATION_DOMAIN_GOVERNANCE_VERSION,
  moduleKey: "automation" as const,
  ruleSoT: "lib/erp-core/events/automation/automation-governance.ts",
  traceSoT: "erp_automation_rule_executions",
  workflowSoT: "erp_automation_workflow_definitions",
  runsSoT: "erp_automation_workflow_runs",
  aiRecommendationsSoT: "erp_ai_recommendations",
  eventOwner: "automation",
} as const;

export const AUTOMATION_CAPABILITY_STATUS = {
  workflowEngine: "active",
  ruleEngine: "active",
  triggerSystem: "active",
  aiOrchestration: "active",
  crossDomainChains: "active",
  observability: "active",
  cockpit: "active",
} as const;
