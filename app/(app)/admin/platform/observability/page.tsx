import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { buildPlatformObservabilityMetrics } from "@/modules/platform/server/services/platform-observability-metrics";
import { PlatformObservabilityMetricsPanel } from "@/modules/platform/components/dashboard/PlatformObservabilityMetrics";

export default async function AdminPlatformObservabilityPage() {
  const supabase = getSupabaseServerClient();
  let metrics = {
    apisActive: 0,
    connectorsConnected: 0,
    connectorsDegraded: 0,
    connectorFailures24h: 0,
    apiInvocations24h: 0,
    pluginErrorsEstimate: 0,
  };
  try {
    metrics = await buildPlatformObservabilityMetrics(supabase);
  } catch {
    /* partial */
  }

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Observabilité plateforme" subtitle="API health, connecteurs, plugins et latence." />
      <PlatformObservabilityMetricsPanel metrics={metrics} />
    </div>
  );
}
