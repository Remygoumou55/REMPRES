/**
 * Operations domain maturity matrix registry — Bloc 3 Étape 5.
 */
export const OPERATIONS_DOMAIN_MATURITY_VERSION = "operations-domain-maturity-bloc3-v1" as const;

export const OPERATIONS_DOMAIN_MATURITY_MATRIX = [
  { area: "tasks", expected: "create assign complete + history", result: "active" as const },
  { area: "workflows", expected: "pending→closed transitions", result: "active" as const },
  { area: "projects", expected: "owner team budget governance", result: "active" as const },
  { area: "delivery", expected: "milestones progress delays", result: "active" as const },
  { area: "orchestration", expected: "crm supply approval bridges", result: "active" as const },
  { area: "events", expected: "9 ops.* active", result: "active" as const },
  { area: "cockpit", expected: "buildDeptConsultationKpiPayload ops", result: "active" as const },
] as const;
