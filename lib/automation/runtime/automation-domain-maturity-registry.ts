/**
 * Automation domain maturity matrix — Bloc 3 Étape 7.
 */
export const AUTOMATION_DOMAIN_MATURITY_VERSION = "automation-domain-maturity-bloc3-v1" as const;

export const AUTOMATION_DOMAIN_MATURITY_MATRIX = [
  { area: "workflowEngine", expected: "erp_automation_workflow_definitions + runs", result: "active" as const },
  { area: "ruleEngine", expected: "ERP_AUTOMATION_RULES governed", result: "active" as const },
  { area: "triggers", expected: "event bus + cross-domain bridge", result: "active" as const },
  { area: "aiOrchestration", expected: "ai-decision-support structured", result: "active" as const },
  { area: "observability", expected: "rule_executions + trace ring", result: "active" as const },
  { area: "cockpit", expected: "/admin/automation hub", result: "active" as const },
  { area: "events", expected: "9 automation.* types", result: "active" as const },
] as const;
