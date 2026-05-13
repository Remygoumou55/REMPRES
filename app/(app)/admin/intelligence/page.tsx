import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { loadEnterpriseIntelligence } from "@/lib/governance/analytics/enterprise-intelligence";
import { GovernanceSummaryGrid } from "@/components/governance/analytics/GovernanceSummaryGrid";
import { DepartmentComparisonTable } from "@/components/governance/analytics/DepartmentComparisonTable";
import { IncidentAnalyticsCard } from "@/components/governance/analytics/IncidentAnalyticsCard";
import { ApprovalAnalyticsCard } from "@/components/governance/analytics/ApprovalAnalyticsCard";
import { EnterpriseHealthScore } from "@/components/governance/analytics/EnterpriseHealthScore";
import { AnalyticsPeriodFilter } from "@/components/governance/analytics/AnalyticsPeriodFilter";
import { EnterpriseTrendChart } from "@/components/governance/analytics/EnterpriseTrendChart";
import { IntelligenceRealtimeBridge } from "@/components/governance/analytics/IntelligenceRealtimeBridge";
import { FilterPanelShell } from "@/components/ui/filter-panel-shell";

type PageProps = {
  searchParams?: {
    period?: "7d" | "30d" | "90d";
  };
};

export default async function AdminIntelligencePage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const allowed = await isSuperAdmin(data.user.id);
  if (!allowed) redirect("/access-denied");

  const period = searchParams?.period ?? "30d";
  const intelligence = await loadEnterpriseIntelligence(period);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <IntelligenceRealtimeBridge />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Centre d&apos;intelligence entreprise</h1>
        <p className="mt-1 text-sm text-gray-600">
          Supervision strategique, comparaison departements et pilotage KPI gouvernance.
        </p>
      </section>

      <FilterPanelShell title="Période d'analyse">
      <form method="get">
        <div className="flex flex-wrap items-center gap-2">
          <AnalyticsPeriodFilter selected={period} />
          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white"
          >
            Appliquer
          </button>
        </div>
      </form>
      </FilterPanelShell>

      <GovernanceSummaryGrid
        salesToday={intelligence.enterprise.salesToday}
        salesMonth={intelligence.enterprise.salesMonth}
        unresolvedAlerts={intelligence.unresolvedAlerts}
        pendingApprovals={intelligence.pendingApprovals}
        healthScore={intelligence.healthScore}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EnterpriseTrendChart
            points={intelligence.trend.points}
            growthTrend={intelligence.trend.growthTrend}
            incidentTrend={intelligence.trend.incidentTrend}
            approvalBottleneck={intelligence.trend.approvalBottleneck}
          />
        </div>
        <div className="space-y-4">
          <EnterpriseHealthScore score={intelligence.healthScore} />
          <IncidentAnalyticsCard
            unresolvedAlerts={intelligence.unresolvedAlerts}
            securityEvents7d={intelligence.compliance.securityEvents7d}
          />
          <ApprovalAnalyticsCard
            pendingApprovals={intelligence.pendingApprovals}
            criticalEvents7d={intelligence.compliance.criticalEvents7d}
          />
        </div>
      </div>

      <DepartmentComparisonTable rows={intelligence.comparisonRows} />
    </div>
  );
}
