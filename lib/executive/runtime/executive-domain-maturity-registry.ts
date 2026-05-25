/**
 * Executive domain maturity matrix — Bloc 3 Étape 6.
 */
export const EXECUTIVE_DOMAIN_MATURITY_VERSION = "executive-domain-maturity-bloc3-v1" as const;

export const EXECUTIVE_DOMAIN_MATURITY_MATRIX = [
  { area: "cockpit", expected: "live SQL cross-domain snapshot", result: "active" as const },
  { area: "bi", expected: "KPI registry + snapshots", result: "active" as const },
  { area: "forecast", expected: "revenue cash pipeline ops", result: "active" as const },
  { area: "observability", expected: "admin hub + bus console", result: "active" as const },
  { area: "alerting", expected: "executive signals", result: "active" as const },
  { area: "crossDomain", expected: "intelligence correlations", result: "active" as const },
  { area: "events", expected: "9 executive/analytics/obs.*", result: "active" as const },
] as const;
