import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listCrmActivitiesOpen } from "@/modules/crm/server/repositories/crm-activities-repository";
import { CrmScrollTable } from "@/modules/crm/ui/tables/CrmScrollTable";
import { CrmSectionPanel } from "@/modules/crm/ui/panels/SectionPanel";

export default async function VenteCrmActivitiesPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listCrmActivitiesOpen(supabase, 200);

  return (
    <div className="page-wrapper">
      <PageHeader title="Activités commerciales" subtitle="Tâches ouvertes — rattachement polymorphe lead / opportunité / client / devis / vente." />
      <CrmSectionPanel title="À traiter">
        <CrmScrollTable>
          <table className="min-w-[880px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Type</th>
                <th className="border-b px-3 py-2 font-medium">Sujet</th>
                <th className="border-b px-3 py-2 font-medium">Lié</th>
                <th className="border-b px-3 py-2 font-medium">Échéance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 capitalize text-gray-800">{r.activity_type}</td>
                  <td className="max-w-[320px] truncate px-3 py-2.5 font-medium text-darktext">{r.subject}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600">
                    {r.related_kind}:{r.related_id.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">
                    {r.due_at ? new Date(r.due_at).toLocaleString("fr-FR") : "—"}
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
