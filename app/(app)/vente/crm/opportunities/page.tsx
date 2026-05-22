import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { CrmOpportunityCreateForm } from "@/modules/crm/components/workflows/CrmOpportunityCreateForm";
import { CrmOpportunityStageSelect } from "@/modules/crm/components/workflows/CrmOpportunityStageSelect";
import { listCrmOpportunitiesWithStages } from "@/modules/crm/server/repositories/crm-opportunities-repository";
import { listCrmPipelineStages } from "@/modules/crm/server/repositories/crm-pipeline-repository";
import { CrmScrollTable } from "@/modules/crm/ui/tables/CrmScrollTable";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

export default async function VenteCrmOpportunitiesPage() {
  const supabase = getSupabaseServerClient();
  const [rows, stages] = await Promise.all([
    listCrmOpportunitiesWithStages(supabase, 250),
    listCrmPipelineStages(supabase),
  ]);
  const stageOptions = stages.map((s) => ({ id: s.id, label: s.label, code: s.code }));

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Opportunités" subtitle="Reliées aux étapes pipeline — probabilité pilotée par défaut d’étape." />
      <CrmOpportunityCreateForm stages={stageOptions} />
      <CrmSectionPanel title="Toutes opportunités actives">
        <CrmScrollTable>
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Titre</th>
                <th className="border-b px-3 py-2 font-medium">Étape</th>
                <th className="border-b px-3 py-2 font-medium text-right">Montant</th>
                <th className="border-b px-3 py-2 font-medium text-right">Prob.</th>
                <th className="border-b px-3 py-2 font-medium">Clôture</th>
                <th className="border-b px-3 py-2 font-medium">Étape →</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const st = r.crm_pipeline_stages;
                const terminal = Boolean(st?.is_terminal_win || st?.is_terminal_loss);
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="max-w-[260px] truncate px-3 py-2.5 font-semibold text-darktext">{r.title}</td>
                    <td className="px-3 py-2.5 text-gray-800">
                      {st?.label ?? "—"}{" "}
                      <span className="font-mono text-xs text-gray-500">({st?.code ?? "?"})</span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoneyGnf(r.amount_estimated_gnf)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{r.probability_pct}%</td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {r.expected_close_date
                        ? new Date(r.expected_close_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <CrmOpportunityStageSelect
                        opportunityId={r.id}
                        currentStageId={r.stage_id}
                        currentTerminal={terminal}
                        stages={stageOptions}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CrmScrollTable>
      </CrmSectionPanel>
    </div>
  );
}
