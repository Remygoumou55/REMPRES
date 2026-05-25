import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  listPlatformConnectorInstances,
  listPlatformConnectorLogsRecent,
} from "@/modules/platform/server/repositories/connector-instances-repository";

export default async function AdminPlatformConnectorsPage() {
  const supabase = getSupabaseServerClient();
  let instances: Awaited<ReturnType<typeof listPlatformConnectorInstances>> = [];
  let logs: Awaited<ReturnType<typeof listPlatformConnectorLogsRecent>> = [];
  try {
    [instances, logs] = await Promise.all([
      listPlatformConnectorInstances(supabase),
      listPlatformConnectorLogsRecent(supabase, 40),
    ]);
  } catch {
    /* migration pending */
  }

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Connector Engine" subtitle="État, retry, health et logs d'exécution." />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Connecteur</th>
              <th className="px-4 py-3">Intégration</th>
              <th className="px-4 py-3">État</th>
              <th className="px-4 py-3">Santé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {instances.map((c) => (
              <tr key={c.id} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{c.connector_key}</td>
                <td className="px-4 py-2 font-mono text-xs">{c.integration_key}</td>
                <td className="px-4 py-2">{c.connection_state}</td>
                <td className="px-4 py-2 tabular-nums">{c.health_score ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Logs récents</h2>
          <ul className="rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs text-gray-700">
            {logs.map((l) => (
              <li key={l.id}>
                {l.outcome} — {l.latency_ms ?? 0}ms — {l.created_at?.slice(11, 19)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
