/**
 * Bloc 3 Étape 8 — Developer ecosystem (SDK strategy, onboarding, sandbox — pas de chatbot).
 */
export const DEVELOPER_ECOSYSTEM_VERSION = "developer-ecosystem-bloc3-v1" as const;

export const DEVELOPER_ECOSYSTEM_GUIDE = {
  sdkStrategy: "TypeScript SDK @rempres/erp-sdk (manifest v1, events + installations)",
  documentationPaths: [
    "docs/PLATFORM_MARKETPLACE_ECOSYSTEM_REPORT.md",
    "lib/platform/governance/api-governance-registry.ts",
    "modules/platform/constants/nav.ts",
  ],
  sandboxPluginKey: "rempres.dev.sandbox",
  onboardingSteps: [
    "Demander accès module platform (read)",
    "Consulter API registry et rate limits",
    "Installer sandbox SDK bundle depuis marketplace",
    "Publier via erp_platform_external_event_outbox",
  ],
  integrationPatterns: ["webhook", "api_oauth_stub", "exchange", "custom"] as const,
} as const;

export const DEVELOPER_SANDBOX_MANIFEST = {
  plugin_key: "rempres.dev.sandbox",
  capabilities: ["read_events", "test_connectors", "mock_installations"],
  isolation: "tenant_scoped",
  write_domains_forbidden: ["finance_journal", "hr_payroll"],
} as const;
