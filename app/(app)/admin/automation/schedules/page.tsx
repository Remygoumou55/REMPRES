import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listAutomationSchedules } from "@/modules/automation/server/repositories/automation-schedules-repository";

export default async function AdminAutomationSchedulesPage() {
  const supabase = getSupabaseServerClient();
  const schedules = await listAutomationSchedules(supabase, 100);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Planifications" subtitle="Schedules actifs et prochaines exécutions." />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Prochain run</th>
              <th className="px-4 py-3">Actif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedules.map((s) => (
              <tr key={s.id} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{s.workflow_key}</td>
                <td className="px-4 py-2 text-xs">{s.next_run_at?.slice(0, 19)}</td>
                <td className="px-4 py-2">{s.is_active ? "oui" : "non"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
