import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listRecentLogisticsMovements } from "@/modules/logistics/server/repositories/logistics-movements-repository";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";
import { LogisticsScrollTable } from "@/modules/logistics/ui/tables/LogisticsScrollTable";

export default async function LogistiqueMouvementsPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listRecentLogisticsMovements(supabase, 150);

  return (
    <div className="space-y-6">
      <PageHeader title="Mouvements de stock" subtitle="Journal append-only — deltas signés par site." />
      <LogisticsSectionPanel title="Flux récents">
        <LogisticsScrollTable>
          <table className="min-w-[920px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Date</th>
                <th className="border-b px-3 py-2 font-medium">Type</th>
                <th className="border-b px-3 py-2 font-medium text-right">Δ Qté</th>
                <th className="border-b px-3 py-2 font-medium">Référence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 text-xs text-gray-700">
                    {new Date(m.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2.5 text-xs capitalize text-gray-800">{m.movement_type}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-darktext">{m.qty_signed}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">
                    {m.reference_type}:{m.reference_id.slice(0, 12)}
                    {m.reference_id.length > 12 ? "…" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </LogisticsScrollTable>
      </LogisticsSectionPanel>
    </div>
  );
}
