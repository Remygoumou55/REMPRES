/**
 * Platform + Marketplace + Ecosystem domain governance — Bloc 3 Étape 8.
 */
export const PLATFORM_DOMAIN_GOVERNANCE_VERSION = "platform-domain-governance-bloc3-v1" as const;

export const PLATFORM_DOMAIN_GOVERNANCE = {
  version: PLATFORM_DOMAIN_GOVERNANCE_VERSION,
  moduleKeys: ["platform", "ecosystem"] as const,
  apiRegistrySoT: "erp_platform_api_registry",
  integrationSoT: "erp_platform_integration_definitions",
  connectorSoT: "erp_platform_connector_instances",
  marketplaceSoT: "erp_platform_catalog_plugins",
  pluginInstallSoT: "erp_platform_plugin_installations",
  eventOwner: "platform",
} as const;

export const PLATFORM_CAPABILITY_STATUS = {
  apiGovernance: "active",
  integrationFramework: "active",
  connectorEngine: "active",
  pluginArchitecture: "active",
  marketplaceFoundation: "active",
  developerEcosystem: "active",
  platformObservability: "active",
  cockpit: "active",
} as const;
