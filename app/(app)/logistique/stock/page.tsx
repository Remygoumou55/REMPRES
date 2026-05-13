import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listLogisticsStockWithProducts } from "@/modules/logistics/server/repositories/logistics-stock-repository";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";
import { LogisticsScrollTable } from "@/modules/logistics/ui/tables/LogisticsScrollTable";

export default async function LogistiqueStockPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listLogisticsStockWithProducts(supabase, 250);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Stock multi-sites"
        subtitle="Quantités par entrepôt et article : réceptions, expéditions et seuils d’alerte catalogue."
      />
      <LogisticsSectionPanel title="Inventaire">
        <LogisticsScrollTable>
          <table className="min-w-[820px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Entrepôt</th>
                <th className="border-b px-3 py-2 font-medium">SKU</th>
                <th className="border-b px-3 py-2 font-medium">Produit</th>
                <th className="border-b px-3 py-2 font-medium text-right">Qté</th>
                <th className="border-b px-3 py-2 font-medium text-right">Seuil</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.warehouse_id}-${r.product_id}`} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 text-xs text-gray-600">{r.warehouse_id.slice(0, 8)}…</td>
                  <td className="px-3 py-2.5 text-xs font-semibold tabular-nums text-darktext">
                    {r.products?.sku ?? "—"}
                  </td>
                  <td className="max-w-[240px] truncate px-3 py-2.5 text-gray-800">{r.products?.name ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">{r.qty_on_hand}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">{r.products?.stock_threshold ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LogisticsScrollTable>
      </LogisticsSectionPanel>
    </div>
  );
}
