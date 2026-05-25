import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { OpsProjectCreateForm } from "@/modules/operations/components/workflows/OpsProjectCreateForm";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";

export default async function OperationsProjectsPage() {
  const supabase = getSupabaseServerClient();
  const user = await getServerSessionUser();
  const userId = user?.id ?? "";

  const { data: rows, error } = await supabase
    .from("erp_ops_projects")
    .select("id,project_code,title,status,owner_user_id,budget_reference,updated_at")
    .order("updated_at", { ascending: false })
    .limit(60);

  if (error) throw new Error(error.message);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Projets"
        subtitle="Gouvernance projet : owner, équipe, référence budget, statut et traçabilité."
      />
      {userId ? <OpsProjectCreateForm ownerUserId={userId} /> : null}
      <OperationsSectionPanel title="Portefeuille projets">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Code</th>
                <th className="border-b px-3 py-2 font-medium">Titre</th>
                <th className="border-b px-3 py-2 font-medium">Statut</th>
                <th className="border-b px-3 py-2 font-medium">Budget ref.</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-mono text-xs">{p.project_code}</td>
                  <td className="px-3 py-2.5 font-medium">{p.title}</td>
                  <td className="px-3 py-2.5 capitalize">{p.status}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-600">{p.budget_reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OperationsSectionPanel>
    </div>
  );
}
