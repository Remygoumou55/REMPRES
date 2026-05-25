import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listAutomationWorkflowRuns } from "@/modules/automation/server/repositories/automation-runs-repository";

export default async function AdminAutomationRunsPage() {
  const supabase = getSupabaseServerClient();
  const runs = await listAutomationWorkflowRuns(supabase);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Exécutions workflow" subtitle="Runs en cours, en attente d'approbation ou terminés." />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Étape</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {runs.map((r) => (
              <tr key={r.id} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{r.workflow_key}</td>
                <td className="px-4 py-2">{r.status}</td>
                <td className="px-4 py-2 tabular-nums">{r.current_step}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{r.created_at?.slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
