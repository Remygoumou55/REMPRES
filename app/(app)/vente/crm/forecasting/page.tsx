import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listCrmForecastSnapshotsRecent } from "@/modules/crm/server/repositories/crm-forecast-repository";
import { CrmScrollTable } from "@/modules/crm/ui/tables/CrmScrollTable";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

export default async function VenteCrmForecastingPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listCrmForecastSnapshotsRecent(supabase, 48);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prévisions commerciales"
        subtitle="Snapshots batch (`crm_forecast_snapshots`) — alimentés par jobs applicatifs ou RPC futures."
      />
      <CrmSectionPanel title="Derniers snapshots">
        <CrmScrollTable>
          <table className="min-w-[920px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Période</th>
                <th className="border-b px-3 py-2 font-medium">Grain</th>
                <th className="border-b px-3 py-2 font-medium text-right">Pipeline brut</th>
                <th className="border-b px-3 py-2 font-medium text-right">Pipeline pondéré</th>
                <th className="border-b px-3 py-2 font-medium text-right">Gagné</th>
                <th className="border-b px-3 py-2 font-medium">Calculé</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                    Aucun snapshot encore — prévoir un job qui agrège opportunités et ventes validées.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="px-3 py-2.5 text-sm font-medium text-darktext">
                      {new Date(r.period_start).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-3 py-2.5 capitalize text-gray-700">{r.grain}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoneyGnf(r.pipeline_raw_gnf)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatMoneyGnf(r.weighted_pipeline_gnf)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoneyGnf(r.closed_won_gnf)}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {new Date(r.computed_at).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CrmScrollTable>
      </CrmSectionPanel>
    </div>
  );
}
