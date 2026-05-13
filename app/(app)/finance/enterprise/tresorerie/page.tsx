import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getFinanceCashflowDailyRange } from "@/modules/finance/server/repositories/finance-cashflow-repository";
import { FinanceCashflowSection } from "@/modules/finance/components/treasury/FinanceCashflowSection";
import { FinanceScrollTable } from "@/modules/finance/ui/tables/FinanceScrollTable";
import { SectionPanel } from "@/modules/finance/ui/panels/SectionPanel";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function ninetyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return d.toISOString().slice(0, 10);
}

export default async function FinanceEnterpriseTreasuryPage() {
  const supabase = getSupabaseServerClient();
  const from = ninetyDaysAgo();
  const to = today();
  const rows = await getFinanceCashflowDailyRange(supabase, from, to);

  const chartPoints = rows.map((r) => ({
    date: r.snapshot_date,
    closing: Number(r.closing_balance_gnf),
  }));

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Trésorerie"
        subtitle="Soldes de clôture quotidiens consolidés pour le pilotage de la trésorerie."
      />

      <SectionPanel title="Courbe de clôture (GNF)" description={`Période ${from} → ${to}`}>
        <FinanceCashflowSection points={chartPoints} />
      </SectionPanel>

      <SectionPanel title="Détail quotidien">
        {!rows.length ? (
          <p className="text-sm text-gray-500">
            Aucune donnée de trésorerie consolidée sur cette période. Les indicateurs seront disponibles après la
            prochaine consolidation planifiée.
          </p>
        ) : (
          <FinanceScrollTable>
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="border-b px-3 py-2 font-medium">Date</th>
                  <th className="border-b px-3 py-2 font-medium text-right">Ouverture</th>
                  <th className="border-b px-3 py-2 font-medium text-right">Entrées</th>
                  <th className="border-b px-3 py-2 font-medium text-right">Sorties</th>
                  <th className="border-b px-3 py-2 font-medium text-right">Clôture</th>
                  <th className="border-b px-3 py-2 font-medium">Calculé</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.snapshot_date} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="px-3 py-2.5 tabular-nums font-medium text-darktext">{r.snapshot_date}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">
                      {Number(r.opening_balance_gnf).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-800">
                      {Number(r.inflow_gnf).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-red-800">
                      {Number(r.outflow_gnf).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-darktext">
                      {Number(r.closing_balance_gnf).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">
                      {new Date(r.computed_at).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </FinanceScrollTable>
        )}
      </SectionPanel>
    </div>
  );
}
