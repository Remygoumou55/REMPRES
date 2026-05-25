import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listPlatformIntegrationDefinitions } from "@/modules/platform/server/repositories/integration-definitions-repository";

export default async function AdminPlatformIntegrationsPage() {
  const supabase = getSupabaseServerClient();
  let defs: Awaited<ReturnType<typeof listPlatformIntegrationDefinitions>> = [];
  try {
    defs = await listPlatformIntegrationDefinitions(supabase);
  } catch {
    /* fallback */
  }

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Integration Framework"
        subtitle="Banking, payment, email, calendar, cloud — définitions versionnées."
      />
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Clé</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Connecteur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {defs.map((d) => (
              <tr key={d.integration_key} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{d.integration_key}</td>
                <td className="px-4 py-2">{d.category}</td>
                <td className="px-4 py-2 font-mono text-xs">{d.connector_plugin_key ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
