import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { OPERATIONS_NAV } from "@/modules/operations/constants/nav";
import { OperationsMetricCard } from "@/modules/operations/ui/cards/OperationsMetricCard";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";
import { getOperationsOperationalOverview } from "@/modules/operations/server/services/ops-overview";

export default async function OperationsHubPage() {
  const supabase = getSupabaseServerClient();
  const user = await getServerSessionUser();
  const overview = await getOperationsOperationalOverview(supabase);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Operations & Projets"
        subtitle="Tâches, workflows, projets et livraison — domaine gouverné, event-driven, cross-domain."
        actions={
          <Link
            href="/operations/dashboard"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
          >
            Cockpit opérationnel
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <OperationsMetricCard label="Tâches ouvertes" value={overview.openTasks} />
        <OperationsMetricCard label="Tâches bloquées" value={overview.blockedTasks} />
        <OperationsMetricCard label="Projets actifs" value={overview.activeProjects} />
        <OperationsMetricCard label="Workflows actifs" value={overview.activeWorkflows} />
        <OperationsMetricCard
          label="Taux livraison"
          value={`${overview.completionRatePct}%`}
          hint={`${overview.delayedDeliveries} retard(s)`}
        />
      </div>

      <OperationsSectionPanel
        title="Accès rapide"
        description="Parcours operations : tâches, projets, workflows, livraison et reporting."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OPERATIONS_NAV.filter((x) => x.href !== "/operations").map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="card flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-slate-400/40 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-semibold text-darktext">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </OperationsSectionPanel>

      {user ? (
        <p className="text-xs text-gray-500">
          Opérateur connecté — création tâche/projet via les écrans dédiés (owner = vous).
        </p>
      ) : null}
    </div>
  );
}
