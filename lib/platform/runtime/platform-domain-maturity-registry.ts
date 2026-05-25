/**
 * Platform domain maturity matrix — Bloc 3 Étape 8.
 */
export const PLATFORM_DOMAIN_MATURITY_VERSION = "platform-domain-maturity-bloc3-v1" as const;

export const PLATFORM_DOMAIN_MATURITY_MATRIX = [
  { area: "apiGovernance", expected: "api-governance-registry + SQL", result: "active" as const },
  { area: "integrations", expected: "integration_definitions catalog", result: "active" as const },
  { area: "connectors", expected: "connector-engine health + logs", result: "active" as const },
  { area: "plugins", expected: "catalog + installations", result: "active" as const },
  { area: "marketplace", expected: "listed catalog plugins", result: "active" as const },
  { area: "developerEcosystem", expected: "sandbox registry + SDK guide", result: "active" as const },
  { area: "cockpit", expected: "/admin/platform hub", result: "active" as const },
  { area: "events", expected: "9 platform.* types", result: "active" as const },
] as const;
