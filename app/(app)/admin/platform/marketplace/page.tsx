import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listListedCatalogPlugins } from "@/modules/platform/server/repositories/catalog-plugins-repository";
import { TableShell } from "@/components/ui/table-shell";

export default async function AdminPlatformMarketplacePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["platform"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const items = await listListedCatalogPlugins(supabase);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Marketplace — catalogue</h1>
        <p className="mt-1 text-sm text-gray-600">
          Entrées <span className="font-medium">erp_platform_catalog_plugins</span> ; installations par tenant dans{" "}
          <span className="font-medium">erp_platform_plugin_installations</span>.
        </p>

        <TableShell className="mt-4">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 font-medium">Clé</th>
                <th className="py-2 pr-4 font-medium">Nom</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Éditeur</th>
                <th className="py-2 font-medium">Risque</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-800">{row.plugin_key}</td>
                  <td className="py-2 pr-4 text-gray-900">{row.display_name}</td>
                  <td className="py-2 pr-4 text-gray-700">{row.kind}</td>
                  <td className="py-2 pr-4 text-gray-700">{row.publisher_key}</td>
                  <td className="py-2 text-gray-700">{row.risk_tier}</td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Catalogue vide — appliquer la migration 056.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableShell>

        <Link href="/admin/multitenant/tenants" className="mt-4 inline-flex text-sm font-medium text-cyan-800 hover:underline">
          Tenants →
        </Link>
      </section>
    </>
  );
}
