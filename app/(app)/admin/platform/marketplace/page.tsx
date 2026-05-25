import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listListedCatalogPlugins } from "@/modules/platform/server/repositories/catalog-plugins-repository";
import { getMarketplaceCatalogSummary } from "@/modules/platform/server/services/marketplace-catalog-service";

export default async function AdminPlatformMarketplacePage() {
  const supabase = getSupabaseServerClient();
  const [plugins, summary] = await Promise.all([
    listListedCatalogPlugins(supabase),
    getMarketplaceCatalogSummary(supabase),
  ]);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Marketplace"
        subtitle={`${summary.listed} listings — discovery, compatibilité et lifecycle gouvernés.`}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {Object.entries(summary.byKind).map(([kind, count]) => (
          <div key={kind} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">{kind}</div>
            <div className="text-2xl font-semibold">{count}</div>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Plugin</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Risque</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plugins.map((p) => (
              <tr key={p.id} className="bg-white">
                <td className="px-4 py-2">
                  <div className="font-semibold">{p.display_name}</div>
                  <div className="font-mono text-xs text-gray-500">{p.plugin_key}</div>
                </td>
                <td className="px-4 py-2">{p.kind}</td>
                <td className="px-4 py-2">{p.risk_tier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
