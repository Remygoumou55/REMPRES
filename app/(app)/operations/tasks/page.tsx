import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { OpsTaskCreateForm } from "@/modules/operations/components/workflows/OpsTaskCreateForm";
import { OpsTaskRowActions } from "@/modules/operations/components/workflows/OpsTaskRowActions";
import { OperationsSectionPanel } from "@/modules/operations/ui/panels/SectionPanel";

export default async function OperationsTasksPage() {
  const supabase = getSupabaseServerClient();
  const user = await getServerSessionUser();
  const userId = user?.id ?? "";

  const { data: rows, error } = await supabase
    .from("erp_ops_tasks")
    .select("id,task_code,title,status,priority,assignee_user_id,due_at,updated_at")
    .order("updated_at", { ascending: false })
    .limit(80);

  if (error) throw new Error(error.message);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Tâches"
        subtitle="Moteur de tâches gouverné : propriétaire, exécutant, priorité, échéance et historique."
      />
      {userId ? <OpsTaskCreateForm ownerUserId={userId} /> : null}
      <OperationsSectionPanel title="Backlog opérationnel">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b px-3 py-2 font-medium">Code</th>
                <th className="border-b px-3 py-2 font-medium">Titre</th>
                <th className="border-b px-3 py-2 font-medium">Statut</th>
                <th className="border-b px-3 py-2 font-medium">Priorité</th>
                <th className="border-b px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="px-3 py-2.5 font-mono text-xs">{t.task_code}</td>
                  <td className="px-3 py-2.5 font-medium">{t.title}</td>
                  <td className="px-3 py-2.5 capitalize">{t.status}</td>
                  <td className="px-3 py-2.5 capitalize">{t.priority}</td>
                  <td className="px-3 py-2.5">
                    <OpsTaskRowActions taskId={t.id} status={t.status} />
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
