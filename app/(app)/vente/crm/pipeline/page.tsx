import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listCrmPipelineWeightedRows } from "@/modules/crm/server/repositories/crm-pipeline-weighted-repository";
import { CrmScrollTable } from "@/modules/crm/ui/tables/CrmScrollTable";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

export default async function VenteCrmPipelinePage() {
  const supabase = getSupabaseServerClient();
  const rows = await listCrmPipelineWeightedRows(supabase, 400);

  const totals = rows.reduce(
    (acc, r) => {
      acc.raw += Number(r.amount_estimated_gnf ?? 0);
      acc.weighted += Number(r.weighted_amount_gnf ?? 0);
      return acc;
    },
    { raw: 0, weighted: 0 },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline commercial"
        subtitle={`Vue pondérée agrégée — brut ${formatMoneyGnf(totals.raw)}, pondéré ${formatMoneyGnf(totals.weighted)}.`}
      />
      <CrmSectionPanel title="Opportunités ouvertes (hors perdu)" description="Source : vue `v_crm_pipeline_weighted`.">
        <CrmScrollTable>
          <table className="min-w-[920px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Titre</th>
                <th className="border-b px-3 py-2 font-medium">Étape</th>
                <th className="border-b px-3 py-2 font-medium text-right">Montant</th>
                <th className="border-b px-3 py-2 font-medium text-right">Prob.</th>
                <th className="border-b px-3 py-2 font-medium text-right">Pondéré</th>
                <th className="border-b px-3 py-2 font-medium">Clôture prévue</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.opportunity_id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="max-w-[260px] truncate px-3 py-2.5 font-semibold text-darktext">{r.title}</td>
                  <td className="px-3 py-2.5 text-gray-800">
                    <span className="font-mono text-xs text-gray-500">{r.stage_code}</span>{" "}
                    <span className="text-sm">{r.stage_label}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoneyGnf(r.amount_estimated_gnf)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{r.probability_pct}%</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {formatMoneyGnf(r.weighted_amount_gnf)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">
                    {r.expected_close_date
                      ? new Date(r.expected_close_date).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CrmScrollTable>
      </CrmSectionPanel>
    </div>
  );
}
