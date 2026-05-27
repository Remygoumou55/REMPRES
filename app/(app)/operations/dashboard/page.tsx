import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { OperationsMetricCard } from "@/modules/operations/ui/cards/OperationsMetricCard";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";
import { getOperationsOperationalOverview } from "@/modules/operations/server/services/ops-overview";
import { buildOpsOperationalAnalytics } from "@/modules/operations/server/services/ops-analytics-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        <OperationsMetricCard
          label="Tâches en cours"
          value={overview.inProgressTasks}
        />
        <OperationsMetricCard
          label="Tâches en retard"
          value={overview.overdueTasks}
          hint={overview.overdueTasks > 0 ? "Action requise" : undefined}
        />
        <OperationsMetricCard
          label="Projets actifs"
          value={overview.activeProjects}
        />
        <OperationsMetricCard
          label="Terminées ce mois"
          value={overview.doneThisMonth}
        />
      </div>
      <OperationsSectionPanel title="Exécution (période en cours)">
        <p className="text-sm text-gray-700">
          Backlog total : <strong>{overview.openTasks}</strong> — workflows actifs :{" "}
          <strong>{overview.activeWorkflows}</strong> — retards livraison :{" "}
          <strong>{overview.delayedDeliveries}</strong> — tâches terminées (analytics) :{" "}
          <strong>{analytics.tasks.doneThisMonth}</strong>
        </p>
      </OperationsSectionPanel>
    </div>
  );
}
