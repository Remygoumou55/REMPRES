import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listAutomationEventsRecent } from "@/modules/automation/server/repositories/automation-events-repository";

export default async function AdminAutomationEventsPage() {
  const supabase = getSupabaseServerClient();
  const events = await listAutomationEventsRecent(supabase);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Bus événements automation" subtitle="Journal append-only erp_automation_events." />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Clé</th>
              <th className="px-4 py-3">Domaine</th>
              <th className="px-4 py-3">Agrégat</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((e) => (
              <tr key={e.id} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{e.event_key}</td>
                <td className="px-4 py-2">{e.domain_key}</td>
                <td className="px-4 py-2 font-mono text-xs">
                  {e.aggregate_type}:{e.aggregate_id?.slice(0, 8)}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500">{e.created_at?.slice(0, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
