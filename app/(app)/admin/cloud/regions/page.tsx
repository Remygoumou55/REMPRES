import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listCloudRegionsBrief } from "@/modules/cloud/server/repositories/cloud-regions-read-repository";

export default async function AdminCloudRegionsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const regions = await listCloudRegionsBrief(supabase);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/cloud", label: "Cloud mondial" },
          { href: "/admin/cloud/regions", label: "Régions & infra" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Catalogue multi-région</h1>
        <p className="mt-1 text-sm text-gray-600">
          Lignes <span className="font-medium">erp_cloud_regions</span> ; les profils tenant/région rattachent chaque tenant sans dupliquer le registre SaaS.
        </p>
        <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm">
          {regions.length === 0 ? (
            <li className="p-3 text-gray-500">Aucune région (appliquer migration 058).</li>
          ) : (
            regions.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span className="font-medium text-gray-900">{r.display_name}</span>
                <span className="text-xs text-gray-600">
                  {r.region_key} · {r.status}
                </span>
              </li>
            ))
          )}
        </ul>
        <Link href="/admin/multitenant/regions" className="mt-4 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Vue scaling multitenant →
        </Link>
      </section>
    </>
  );
}
