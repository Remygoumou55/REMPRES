import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { buildCrmOperationalAnalytics } from "@/modules/crm/server/services/crm-analytics-service";
import { CrmMetricCard } from "@/modules/crm/ui/cards/CrmMetricCard";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

export default async function VenteCrmAnalyticsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseServerClient();
  const analytics = await buildCrmOperationalAnalytics(supabase);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Analytics CRM"
        subtitle="Conversion, pipeline, win rate et ventes liées CRM — données live."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CrmMetricCard label="Leads ouverts" value={analytics.overview.activeLeads} />
        <CrmMetricCard
          label="Taux conversion"
          value={
            analytics.conversion.conversionRatePct != null
              ? `${analytics.conversion.conversionRatePct} %`
              : "—"
          }
          hint={`${analytics.conversion.convertedLeads} / ${analytics.conversion.totalLeads} leads`}
        />
        <CrmMetricCard label="Pipeline pondéré" value={formatMoneyGnf(analytics.pipeline.weightedValueGnf)} />
        <CrmMetricCard
          label="Win rate"
          value={analytics.deals.winRatePct != null ? `${analytics.deals.winRatePct} %` : "—"}
          hint={`${analytics.deals.wonCount} gagnées · ${analytics.deals.lostCount} perdues`}
        />
        <CrmMetricCard label="Deals ouverts" value={analytics.pipeline.openDealCount} />
        <CrmMetricCard label="Valeur brute pipeline" value={formatMoneyGnf(analytics.pipeline.rawValueGnf)} />
        <CrmMetricCard label="CA ventes liées CRM" value={formatMoneyGnf(analytics.sales.crmLinkedRevenueGnf)} />
        <CrmMetricCard label="Relances ouvertes" value={analytics.overview.openActivities} />
      </div>
      <CrmSectionPanel title="Prévision" description={analytics.forecast.snapshotHint}>
        <p className="text-sm text-gray-700">
          Projection pondérée : <strong>{formatMoneyGnf(analytics.forecast.projectedWeightedGnf)}</strong>
        </p>
      </CrmSectionPanel>
    </div>
  );
}
