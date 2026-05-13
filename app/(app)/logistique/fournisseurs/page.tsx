import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listLogisticsSuppliers } from "@/modules/logistics/server/repositories/logistics-suppliers-repository";
import { LogisticsSectionPanel } from "@/modules/logistics/ui/panels/SectionPanel";
import { LogisticsScrollTable } from "@/modules/logistics/ui/tables/LogisticsScrollTable";

export default async function LogistiqueFournisseursPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listLogisticsSuppliers(supabase, 120);

  return (
    <div className="page-wrapper">
      <PageHeader title="Fournisseurs" subtitle="Référentiel procurement — indépendant du CRM clients." />
      <LogisticsSectionPanel title="Partenaires actifs">
        <LogisticsScrollTable>
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Code</th>
                <th className="border-b px-3 py-2 font-medium">Raison sociale</th>
                <th className="border-b px-3 py-2 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold">{s.supplier_code}</td>
                  <td className="px-3 py-2.5 font-medium text-darktext">{s.company_name}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">{s.contact_email ?? s.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </LogisticsScrollTable>
      </LogisticsSectionPanel>
    </div>
  );
}
