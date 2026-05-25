/**
 * Bloc 3 Étape 8 — API governance registry (SoT TypeScript + SQL erp_platform_api_registry).
 */
export const PLATFORM_API_GOVERNANCE_VERSION = "platform-api-governance-bloc3-v1" as const;

export type PlatformApiLifecycle = "draft" | "active" | "deprecated" | "retired";
export type PlatformApiAuthMethod = "session" | "api_key" | "oauth2" | "mutual_tls";

export type PlatformApiGovernanceEntry = {
  apiKey: string;
  displayName: string;
  version: string;
  authMethod: PlatformApiAuthMethod;
  rateLimitPerMinute: number;
  lifecycleStatus: PlatformApiLifecycle;
  ownerModule: string;
  exposureScope: "internal" | "partner" | "public";
};

export const PLATFORM_API_GOVERNANCE_REGISTRY: readonly PlatformApiGovernanceEntry[] = [
  {
    apiKey: "erp.events.read",
    displayName: "Lecture bus événements",
    version: "v1",
    authMethod: "session",
    rateLimitPerMinute: 60,
    lifecycleStatus: "active",
    ownerModule: "platform",
    exposureScope: "internal",
  },
  {
    apiKey: "erp.finance.snapshot",
    displayName: "Snapshot finance",
    version: "v1",
    authMethod: "session",
    rateLimitPerMinute: 30,
    lifecycleStatus: "active",
    ownerModule: "finance",
    exposureScope: "internal",
  },
  {
    apiKey: "erp.rh.export",
    displayName: "Export RH",
    version: "v1",
    authMethod: "session",
    rateLimitPerMinute: 10,
    lifecycleStatus: "active",
    ownerModule: "hr",
    exposureScope: "internal",
  },
  {
    apiKey: "erp.partner.webhook",
    displayName: "Webhook partenaire",
    version: "v1",
    authMethod: "api_key",
    rateLimitPerMinute: 120,
    lifecycleStatus: "active",
    ownerModule: "platform",
    exposureScope: "partner",
  },
] as const;

export function resolveApiGovernance(apiKey: string): PlatformApiGovernanceEntry | undefined {
  return PLATFORM_API_GOVERNANCE_REGISTRY.find((e) => e.apiKey === apiKey);
}
