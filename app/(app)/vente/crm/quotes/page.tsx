import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listCrmQuotesWithClients } from "@/modules/crm/server/repositories/crm-quotes-repository";
import { CrmScrollTable } from "@/modules/crm/ui/tables/CrmScrollTable";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";
import { formatMoneyGnf } from "@/modules/crm/utils/format-money";

function clientLabel(c: {
  client_type: string;
  company_name: string | null;
  first_name: string | null;
  last_name: string | null;
}): string {
  if (c.client_type === "company") return c.company_name ?? "—";
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
}

export default async function VenteCrmQuotesPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listCrmQuotesWithClients(supabase, 200);

  return (
    <div className="space-y-6">
      <PageHeader title="Devis" subtitle="Références auto `DEV-YYYY-NNNN` — rattachement opportunité optionnel." />
      <CrmSectionPanel title="Devis récents">
        <CrmScrollTable>
          <table className="min-w-[960px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">N°</th>
                <th className="border-b px-3 py-2 font-medium">Client</th>
                <th className="border-b px-3 py-2 font-medium">Statut</th>
                <th className="border-b px-3 py-2 font-medium text-right">Total</th>
                <th className="border-b px-3 py-2 font-medium">Validité</th>
                <th className="border-b px-3 py-2 font-medium">Vente liée</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-darktext">{r.quote_number}</td>
                  <td className="max-w-[240px] truncate px-3 py-2.5">
                    {r.clients ? clientLabel(r.clients) : "—"}
                  </td>
                  <td className="px-3 py-2.5 capitalize text-gray-800">{r.status}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">
                    {formatMoneyGnf(r.total_amount_gnf)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">
                    {r.valid_until ? new Date(r.valid_until).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">
                    {r.sale_id ? `${r.sale_id.slice(0, 8)}…` : "—"}
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
