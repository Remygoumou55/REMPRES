import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listCrmLeadsRecent } from "@/modules/crm/server/repositories/crm-leads-repository";
import { CrmScrollTable } from "@/modules/crm/ui/tables/CrmScrollTable";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

export default async function VenteCrmLeadsPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listCrmLeadsRecent(supabase, 200);

  return (
    <div className="page-wrapper">
      <PageHeader title="Leads" subtitle="Prospects avant conversion client — statuts et valeur estimée." />
      <CrmSectionPanel title="Pipeline entrantes">
        <CrmScrollTable>
          <table className="min-w-[960px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Statut</th>
                <th className="border-b px-3 py-2 font-medium">Contact / Société</th>
                <th className="border-b px-3 py-2 font-medium">Email</th>
                <th className="border-b px-3 py-2 font-medium text-right">Estimation</th>
                <th className="border-b px-3 py-2 font-medium">Créé</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-medium capitalize text-darktext">{r.status}</td>
                  <td className="max-w-[280px] px-3 py-2.5">
                    <div className="truncate font-semibold text-gray-900">{r.company_name ?? "—"}</div>
                    <div className="truncate text-xs text-gray-600">
                      {[r.contact_first_name, r.contact_last_name].filter(Boolean).join(" ") || "—"}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700">{r.email ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{formatMoneyGnf(r.estimated_value_gnf)}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
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
