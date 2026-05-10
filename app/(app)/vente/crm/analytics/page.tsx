import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getCrmOperationalOverview } from "@/modules/crm/server/services/crm-overview";
import { CrmMetricCard } from "@/modules/crm/ui/cards/CrmMetricCard";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { CRM_ANALYTICS_BRIDGE_SCOPES } from "@/modules/crm/analytics/crm-kpi-bridge";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

export default async function VenteCrmAnalyticsPage() {
  const supabase = getSupabaseServerClient();
  const overview = await getCrmOperationalOverview(supabase);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics CRM" subtitle="Indicateurs lecture-seule alignés sur les tables CRM — extension digest ERP possible." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CrmMetricCard label="Leads ouverts" value={overview.activeLeads} />
        <CrmMetricCard label="Opportunités" value={overview.openOpportunities} />
        <CrmMetricCard label="Devis actifs" value={overview.openQuotes} />
        <CrmMetricCard label="Pipeline pondéré" value={formatMoneyGnf(overview.weightedPipelineGnf)} />
      </div>
      <CrmSectionPanel title="Scopes pont analytics" description="Références pour étendre les snapshots sans refactor du moteur analytics.">
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
          {CRM_ANALYTICS_BRIDGE_SCOPES.map((s) => (
            <li key={s} className="font-mono text-xs">
              {s}
            </li>
          ))}
        </ul>
      </CrmSectionPanel>
    </div>
  );
}
