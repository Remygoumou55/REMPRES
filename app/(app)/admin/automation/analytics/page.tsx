import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { buildAutomationCockpitDigest } from "@/modules/automation/server/services/automation-cockpit-digest";
import { AutomationObservabilityMetricsPanel } from "@/modules/automation/components/dashboard/AutomationObservabilityMetrics";

export default async function AdminAutomationAnalyticsPage() {
  const supabase = getSupabaseServerClient();
  const digest = await buildAutomationCockpitDigest(supabase);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Analytics automation"
        subtitle="Taux de succès, volume d'exécutions et charge workflow."
      />
      <AutomationObservabilityMetricsPanel metrics={digest.metrics} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Règles actives</div>
          <div className="mt-1 text-2xl font-semibold">{digest.activeRules}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Runs ouverts</div>
          <div className="mt-1 text-2xl font-semibold">{digest.overview.runsOpen}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs text-gray-500">Événements bus 24h</div>
          <div className="mt-1 text-2xl font-semibold">{digest.overview.events24h}</div>
        </div>
      </div>
    </div>
  );
}
