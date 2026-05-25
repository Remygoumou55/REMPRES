import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { OperationsMetricCard } from "@/modules/operations/ui/cards/OperationsMetricCard";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";
import { getOperationsOperationalOverview } from "@/modules/operations/server/services/ops-overview";
import { buildOpsOperationalAnalytics } from "@/modules/operations/server/services/ops-analytics-service";

export default async function OperationsDashboardPage() {
  const supabase = getSupabaseServerClient();
  const [overview, analytics] = await Promise.all([
    getOperationsOperationalOverview(supabase),
    buildOpsOperationalAnalytics(supabase),
  ]);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Cockpit Operations"
        subtitle="KPIs live : backlog, workflows, projets, livraison — pilotage opérationnel."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OperationsMetricCard label="Backlog tâches" value={overview.openTasks} />
        <OperationsMetricCard label="Charge workflows" value={overview.activeWorkflows} />
        <OperationsMetricCard label="Projets actifs" value={overview.activeProjects} />
        <OperationsMetricCard label="Retards livraison" value={overview.delayedDeliveries} />
      </div>
      <OperationsSectionPanel title="Exécution (période en cours)">
        <p className="text-sm text-gray-700">
          Tâches terminées ce mois : <strong>{analytics.tasks.doneThisMonth}</strong> — workflows
          approuvés : <strong>{analytics.workflows.approved}</strong> — source{" "}
          <code className="text-xs">{analytics.source}</code>
        </p>
      </OperationsSectionPanel>
    </div>
  );
}
