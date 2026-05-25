import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getPlatformOperationalOverview } from "@/modules/platform/server/services/platform-overview";
import { buildPlatformObservabilityMetrics } from "@/modules/platform/server/services/platform-observability-metrics";
import { getMarketplaceCatalogSummary } from "@/modules/platform/server/services/marketplace-catalog-service";
import { PLATFORM_API_GOVERNANCE_REGISTRY } from "@/lib/platform/governance/api-governance-registry";
import { emitPlatformReportGenerated } from "@/lib/erp-core/events/integrations/platform-events";
import { emitPlatformDeveloperSandboxReady } from "@/lib/erp-core/events/integrations/platform-events";
import { DEVELOPER_SANDBOX_MANIFEST } from "@/lib/platform/runtime/developer-ecosystem-registry";

export type PlatformCockpitDigest = {
  overview: Awaited<ReturnType<typeof getPlatformOperationalOverview>>;
  metrics: Awaited<ReturnType<typeof buildPlatformObservabilityMetrics>>;
  marketplace: Awaited<ReturnType<typeof getMarketplaceCatalogSummary>>;
  apiRegistryCount: number;
};

export async function buildPlatformCockpitDigest(
  supabase: SupabaseClient<Database>,
): Promise<PlatformCockpitDigest> {
  const [overview, metrics, marketplace] = await Promise.all([
    getPlatformOperationalOverview(supabase),
    buildPlatformObservabilityMetrics(supabase),
    getMarketplaceCatalogSummary(supabase),
  ]);

  return {
    overview,
    metrics,
    marketplace,
    apiRegistryCount: PLATFORM_API_GOVERNANCE_REGISTRY.length,
  };
}

export async function publishPlatformCockpitDigest(
  supabase: SupabaseClient<Database>,
  actorUserId: string,
): Promise<PlatformCockpitDigest> {
  const digest = await buildPlatformCockpitDigest(supabase);
  const reportId = crypto.randomUUID();

  await emitPlatformReportGenerated({
    actorUserId,
    reportId,
    apisActive: digest.metrics.apisActive,
    connectorsHealthy: digest.metrics.connectorsConnected,
  });

  await emitPlatformDeveloperSandboxReady({
    actorUserId,
    sandboxKey: DEVELOPER_SANDBOX_MANIFEST.plugin_key,
  });

  return digest;
}
