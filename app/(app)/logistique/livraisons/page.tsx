import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listLogisticsDeliveryOrders } from "@/modules/logistics/server/repositories/logistics-deliveries-repository";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";
import { LogisticsScrollTable } from "@/modules/logistics/ui/tables/LogisticsScrollTable";

export default async function LogistiqueLivraisonsPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listLogisticsDeliveryOrders(supabase, 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Livraisons"
        subtitle="Expéditions sortantes — lien optionnel vente (`sale_id`) et mouvements `delivery_issue`."
      />
      <LogisticsSectionPanel title="Ordres de livraison">
        <LogisticsScrollTable>
          <table className="min-w-[820px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Réf.</th>
                <th className="border-b px-3 py-2 font-medium">Statut</th>
                <th className="border-b px-3 py-2 font-medium">Vente liée</th>
                <th className="border-b px-3 py-2 font-medium">Créée</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold">{d.delivery_ref}</td>
                  <td className="px-3 py-2.5 text-xs capitalize">{d.status}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">
                    {d.sale_id ? `${d.sale_id.slice(0, 8)}…` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">{new Date(d.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LogisticsScrollTable>
      </LogisticsSectionPanel>
    </div>
  );
}
