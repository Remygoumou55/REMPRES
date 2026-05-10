import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { PLATFORM_DEFAULT_TENANT_ID } from "@/modules/multitenant/constants/module-keys";
import { listTenantsVisibleForUi } from "@/modules/multitenant/server/repositories/tenants-table-repository";

export default async function AdminMultitenantTenantsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const tenants = await listTenantsVisibleForUi(supabase);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/multitenant", label: "Multi-tenant" },
          { href: "/admin/multitenant/tenants", label: "Tenants" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Tenants</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tenant plateforme par défaut :{" "}
          <code className="rounded bg-gray-100 px-1">{PLATFORM_DEFAULT_TENANT_ID}</code> — rattacher les utilisateurs via{" "}
          <span className="font-medium">erp_tenant_memberships</span>.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 font-medium">Slug</th>
                <th className="py-2 pr-4 font-medium">Nom</th>
                <th className="py-2 pr-4 font-medium">Région</th>
                <th className="py-2 pr-4 font-medium">Statut</th>
                <th className="py-2 font-medium">Plan</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-800">{t.slug}</td>
                  <td className="py-2 pr-4 text-gray-900">{t.display_name}</td>
                  <td className="py-2 pr-4 text-gray-700">{t.region_key}</td>
                  <td className="py-2 pr-4 text-gray-700">{t.status}</td>
                  <td className="py-2 text-gray-700">{t.plan_key}</td>
                </tr>
              ))}
              {!tenants.length ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Aucun tenant visible (appliquer la migration 055 ou vérifier les permissions).
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
