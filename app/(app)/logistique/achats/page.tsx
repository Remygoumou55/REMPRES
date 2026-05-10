import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listLogisticsPurchaseOrders } from "@/modules/logistics/server/repositories/logistics-purchase-orders-repository";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";
import { LogisticsScrollTable } from "@/modules/logistics/ui/tables/LogisticsScrollTable";

export default async function LogistiqueAchatsPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listLogisticsPurchaseOrders(supabase, 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achats"
        subtitle="Commandes fournisseurs — rattachement optionnel aux workflows d’approbation (`approval_requests`)."
      />
      <LogisticsSectionPanel title="Commandes récentes">
        <LogisticsScrollTable>
          <table className="min-w-[840px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">N° PO</th>
                <th className="border-b px-3 py-2 font-medium">Statut</th>
                <th className="border-b px-3 py-2 font-medium text-right">Estimé GNF</th>
                <th className="border-b px-3 py-2 font-medium">Créée</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((po) => (
                <tr key={po.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold">{po.po_number}</td>
                  <td className="px-3 py-2.5 text-xs capitalize text-gray-800">{po.status}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{po.total_estimated_gnf.toLocaleString("fr-FR")}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">{new Date(po.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LogisticsScrollTable>
      </LogisticsSectionPanel>
    </div>
  );
}
