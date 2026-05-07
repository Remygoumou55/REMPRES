import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { loadGlobalGovernanceDashboard } from "@/lib/governance/dashboard/load-global-governance-dashboard";
import { GovernanceDashboardGrid } from "@/components/governance/dashboard/GovernanceDashboardGrid";
import { EnterpriseMetricsSection } from "@/components/governance/dashboard/EnterpriseMetricsSection";
import { GovernanceInsightsSection } from "@/components/governance/dashboard/GovernanceInsightsSection";
import { ActivitySummaryCard } from "@/components/governance/dashboard/ActivitySummaryCard";
import { SystemHealthSection } from "@/components/governance/dashboard/SystemHealthSection";
import { DepartmentHealthCard } from "@/components/governance/dashboard/DepartmentHealthCard";
import { DepartmentOverviewSection } from "@/components/governance/dashboard/DepartmentOverviewSection";
import { DepartmentActivitySection } from "@/components/governance/dashboard/DepartmentActivitySection";

export default async function AdminGlobalDashboardPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) redirect("/access-denied");

  const dashboard = await loadGlobalGovernanceDashboard();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/global-dashboard", label: "Tableau de bord global" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Tableau de bord global</h1>
        <p className="mt-1 text-sm text-gray-600">
          Supervision entreprise: KPI consolides, activite departements et sante systeme.
        </p>
      </section>

      <EnterpriseMetricsSection
        clientsTotal={dashboard.enterprise.clientsTotal}
        salesToday={dashboard.enterprise.salesToday}
        salesMonth={dashboard.enterprise.salesMonth}
        netSaleAmountMonth={dashboard.enterprise.netSaleAmountMonth}
      />

      <GovernanceDashboardGrid>
        <div className="space-y-4 lg:col-span-8">
          <DepartmentOverviewSection departments={dashboard.departments} />
          <DepartmentActivitySection recentActivity={dashboard.recentActivity} />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <GovernanceInsightsSection
            activityEvents24h={dashboard.enterprise.activityEvents24h}
            activeUsers={dashboard.enterprise.activeUsers}
          />
          <ActivitySummaryCard
            activityEvents24h={dashboard.enterprise.activityEvents24h}
            activeUsers={dashboard.enterprise.activeUsers}
          />
          <DepartmentHealthCard departments={dashboard.departments} />
          <SystemHealthSection health={dashboard.systemHealth} />
        </div>
      </GovernanceDashboardGrid>
    </div>
  );
}
