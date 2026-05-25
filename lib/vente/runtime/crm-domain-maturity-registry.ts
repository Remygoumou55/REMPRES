/**
 * CRM domain maturity matrix registry — Bloc 3 Étape 3.
 */
export const CRM_DOMAIN_MATURITY_VERSION = "crm-domain-maturity-bloc3-v1" as const;

export const CRM_DOMAIN_MATURITY_MATRIX = [
  { area: "leads", expected: "create update convert", result: "active" as const },
  { area: "pipeline", expected: "stage mutations + events", result: "active" as const },
  { area: "governance", expected: "owner_id + write registry", result: "active" as const },
  { area: "activities", expected: "create complete + bus", result: "active" as const },
  { area: "analytics", expected: "buildCrmOperationalAnalytics", result: "active" as const },
  { area: "events", expected: "14 crm.* active", result: "active" as const },
  { area: "cockpit", expected: "getCrmOperationalOverview", result: "active" as const },
] as const;
