import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";

export default async function OperationsDeliveryPage() {
  const supabase = getSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("erp_ops_deliveries")
    .select("id,delivery_code,milestone_label,progress_pct,status,delay_reason,project_id")
    .order("updated_at", { ascending: false })
    .limit(60);

  if (error) throw new Error(error.message);

  const projectIds = Array.from(new Set((rows ?? []).map((r) => r.project_id)));
  const projectTitleById = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("erp_ops_projects")
      .select("id,title")
      .in("id", projectIds);
    for (const p of projects ?? []) projectTitleById.set(p.id, p.title);
  }

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Livraison & exécution"
        subtitle="Suivi jalons, progression, retards et clôture — traçabilité par projet."
      />
      <OperationsSectionPanel title="Jalons de livraison">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Code</th>
                <th className="border-b px-3 py-2 font-medium">Projet</th>
                <th className="border-b px-3 py-2 font-medium">Jalon</th>
                <th className="border-b px-3 py-2 font-medium">%</th>
                <th className="border-b px-3 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                    <td className="px-3 py-2.5 font-mono text-xs">{d.delivery_code}</td>
                    <td className="px-3 py-2.5">{projectTitleById.get(d.project_id) ?? "—"}</td>
                    <td className="px-3 py-2.5">{d.milestone_label}</td>
                    <td className="px-3 py-2.5">{d.progress_pct}%</td>
                    <td className="px-3 py-2.5 capitalize">
                      {d.status}
                      {d.delay_reason ? (
                        <span className="ml-1 text-xs text-amber-700">({d.delay_reason})</span>
                      ) : null}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OperationsSectionPanel>
    </div>
  );
}
