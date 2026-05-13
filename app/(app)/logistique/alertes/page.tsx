import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listLogisticsStockAlerts } from "@/modules/logistics/server/repositories/logistics-alerts-repository";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";
import { LogisticsScrollTable } from "@/modules/logistics/ui/tables/LogisticsScrollTable";

export default async function LogistiqueAlertesPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listLogisticsStockAlerts(supabase, 200);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Alertes stock"
        subtitle="Articles au seuil ou en rupture : suivi par entrepôt et par rapport au stock catalogue."
      />
      <LogisticsSectionPanel title="SKU sous tension">
        {!rows.length ? (
          <p className="text-sm text-gray-600">Aucune alerte — seuils non atteints ou stocks non initialisés.</p>
        ) : (
          <LogisticsScrollTable>
            <table className="min-w-[880px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="border-b px-3 py-2 font-medium">Entrepôt</th>
                  <th className="border-b px-3 py-2 font-medium">SKU</th>
                  <th className="border-b px-3 py-2 font-medium">Produit</th>
                  <th className="border-b px-3 py-2 font-medium text-right">Stock</th>
                  <th className="border-b px-3 py-2 font-medium text-right">Seuil</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.warehouse_id}-${r.product_id}`} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="px-3 py-2.5 font-mono text-xs">{r.warehouse_code}</td>
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold">{r.sku}</td>
                    <td className="max-w-[260px] truncate px-3 py-2.5">{r.product_name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-amber-900">{r.qty_on_hand}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">{r.stock_threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </LogisticsScrollTable>
        )}
      </LogisticsSectionPanel>
    </div>
  );
}
