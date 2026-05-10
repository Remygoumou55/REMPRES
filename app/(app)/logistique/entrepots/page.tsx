import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listLogisticsWarehouses } from "@/modules/logistics/server/repositories/logistics-warehouses-repository";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";
import { LogisticsScrollTable } from "@/modules/logistics/ui/tables/LogisticsScrollTable";

export default async function LogistiqueEntrepotsPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listLogisticsWarehouses(supabase);

  return (
    <div className="space-y-6">
      <PageHeader title="Entrepôts" subtitle="Sites logistiques actifs — un siège peut être marqué par défaut." />
      <LogisticsSectionPanel title="Référentiel">
        <LogisticsScrollTable>
          <table className="min-w-[640px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Code</th>
                <th className="border-b px-3 py-2 font-medium">Libellé</th>
                <th className="border-b px-3 py-2 font-medium">Défaut</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-darktext">{w.code}</td>
                  <td className="px-3 py-2.5 text-gray-800">{w.label}</td>
                  <td className="px-3 py-2.5 text-xs">{w.is_default ? "Oui" : "Non"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LogisticsScrollTable>
      </LogisticsSectionPanel>
    </div>
  );
}
