import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  buildCrmOperationalAnalytics,
  generateCrmOperationalAnalyticsReport,
} from "@/modules/crm/server/services/crm-analytics-service";
import { CrmMetricCard } from "@/modules/crm/ui/cards/CrmMetricCard";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

export default async function VenteCrmReportingPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseServerClient();
  const analytics = await buildCrmOperationalAnalytics(supabase);
  await generateCrmOperationalAnalyticsReport(user.id);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Reporting commercial"
        subtitle="Rapport opérationnel généré — P&L commercial, pipeline et conversion."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <CrmMetricCard label="Conversion leads" value={`${analytics.conversion.conversionRatePct ?? "—"} %`} />
        <CrmMetricCard label="Pipeline pondéré" value={formatMoneyGnf(analytics.pipeline.weightedValueGnf)} />
        <CrmMetricCard label="Montant gagné (deals)" value={formatMoneyGnf(analytics.deals.closedWonGnf)} />
        <CrmMetricCard label="Win rate" value={`${analytics.deals.winRatePct ?? "—"} %`} />
        <CrmMetricCard label="Ventes CRM (mois)" value={analytics.sales.crmLinkedSaleCount} />
        <CrmMetricCard label="CA ventes CRM" value={formatMoneyGnf(analytics.sales.crmLinkedRevenueGnf)} />
      </div>
      <CrmSectionPanel title="Parcours opérationnels">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/vente/crm/pipeline" className="font-medium text-primary hover:underline">
            Pipeline pondéré
          </Link>
          <Link href="/vente/crm/analytics" className="font-medium text-primary hover:underline">
            Analytics détaillés
          </Link>
          <Link href="/vente/crm/forecasting" className="font-medium text-primary hover:underline">
            Prévisions & snapshots
          </Link>
        </div>
      </CrmSectionPanel>
    </div>
  );
}
