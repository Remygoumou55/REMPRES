import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listObservabilityIncidents } from "@/modules/observability/server/repositories/observability-incidents-repository";

export default async function AdminObservabilityIncidentsPage() {
  const supabase = getSupabaseServerClient();
  const rows = await listObservabilityIncidents(supabase, 100);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Incidents" subtitle="Registre incidents plateforme — statut et sévérité." />
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Clé</th>
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2">Sévérité</th>
              <th className="px-3 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono text-xs">{r.incident_key}</td>
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2 capitalize">{r.severity}</td>
                <td className="px-3 py-2 capitalize">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
