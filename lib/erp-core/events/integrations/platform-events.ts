/**
 * Bloc 3 Étape 8 — Publishers Platform / Marketplace / Ecosystem.
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const PLATFORM_DEPT_KEY = "ADMINISTRATION" as const;

export async function emitPlatformApiRegistered(params: {
  actorUserId: string;
  apiKey: string;
  version: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_API_REGISTERED, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "erp_platform_api_registry",
    entityId: params.apiKey,
    correlationId: params.apiKey,
    payload: { version: params.version },
  });
}

export async function emitPlatformApiInvoked(params: {
  actorUserId: string;
  apiKey: string;
  routePattern: string;
  statusCode: number;
  latencyMs: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_API_INVOKED, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "erp_platform_api_registry",
    entityId: params.apiKey,
    correlationId: `${params.apiKey}:${Date.now()}`,
    payload: {
      route_pattern: params.routePattern,
      status_code: params.statusCode,
      latency_ms: params.latencyMs,
    },
  });
}

export async function emitPlatformIntegrationConnected(params: {
  actorUserId: string;
  integrationKey: string;
  connectorKey: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_INTEGRATION_CONNECTED, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "erp_platform_integration_definitions",
    entityId: params.integrationKey,
    correlationId: params.connectorKey,
    payload: { connector_key: params.connectorKey },
  });
}

export async function emitPlatformConnectorHealthDegraded(params: {
  actorUserId: string;
  connectorInstanceId: string;
  healthScore: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_CONNECTOR_HEALTH_DEGRADED, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "erp_platform_connector_instances",
    entityId: params.connectorInstanceId,
    correlationId: params.connectorInstanceId,
    payload: { health_score: params.healthScore },
  });
}

export async function emitPlatformConnectorSyncCompleted(params: {
  actorUserId: string;
  connectorInstanceId: string;
  latencyMs: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_CONNECTOR_SYNC_COMPLETED, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "erp_platform_connector_instances",
    entityId: params.connectorInstanceId,
    correlationId: params.connectorInstanceId,
    payload: { latency_ms: params.latencyMs },
  });
}

export async function emitPlatformPluginInstalled(params: {
  actorUserId: string;
  installationId: string;
  pluginKey: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_PLUGIN_INSTALLED, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "erp_platform_plugin_installations",
    entityId: params.installationId,
    correlationId: params.pluginKey,
    payload: { plugin_key: params.pluginKey },
  });
}

export async function emitPlatformMarketplaceListingPublished(params: {
  actorUserId: string;
  pluginKey: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_MARKETPLACE_LISTING_PUBLISHED, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "erp_platform_catalog_plugins",
    entityId: params.pluginKey,
    correlationId: params.pluginKey,
    payload: {},
  });
}

export async function emitPlatformDeveloperSandboxReady(params: {
  actorUserId: string;
  sandboxKey: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_DEVELOPER_SANDBOX_READY, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "developer_sandbox",
    entityId: params.sandboxKey,
    correlationId: params.sandboxKey,
    payload: {},
  });
}

export async function emitPlatformReportGenerated(params: {
  actorUserId: string;
  reportId: string;
  apisActive: number;
  connectorsHealthy: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.PLATFORM_REPORT_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: PLATFORM_DEPT_KEY,
    entityType: "platform_cockpit_report",
    entityId: params.reportId,
    correlationId: params.reportId,
    payload: {
      apis_active: params.apisActive,
      connectors_healthy: params.connectorsHealthy,
    },
  });
}
