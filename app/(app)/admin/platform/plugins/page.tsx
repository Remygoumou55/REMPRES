import { PageHeader } from "@/components/ui/page-header";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listListedCatalogPlugins } from "@/modules/platform/server/repositories/catalog-plugins-repository";

export default async function AdminPlatformPluginsPage() {
  const supabase = getSupabaseServerClient();
  const plugins = await listListedCatalogPlugins(supabase, 200);

  const installationsRes = await supabase
    .from("erp_platform_plugin_installations")
    .select("id,status,installed_version,plugin_id")
    .order("created_at", { ascending: false })
    .limit(50);

  const installs = installationsRes.data ?? [];

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader title="Plugins" subtitle="Manifest, permissions, lifecycle et registry." />
      <p className="text-sm text-gray-600">
        Catalogue : {plugins.length} entrées — installations actives :{" "}
        {installs.filter((i) => i.status === "active").length}
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Plugin</th>
              <th className="px-4 py-3">Publisher</th>
              <th className="px-4 py-3">Kind</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plugins.map((p) => (
              <tr key={p.id} className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">{p.plugin_key}</td>
                <td className="px-4 py-2">{p.publisher_key}</td>
                <td className="px-4 py-2">{p.kind}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
