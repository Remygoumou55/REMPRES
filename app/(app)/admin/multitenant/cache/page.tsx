import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { MULTITENANT_CACHE_TAGS } from "@/modules/multitenant/constants/cache-tags";

export default async function AdminMultitenantCachePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/multitenant", label: "Multi-tenant" },
          { href: "/admin/multitenant/cache", label: "Cache" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Cache tenant-aware</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tags Next : <code className="rounded bg-gray-100 px-1">{MULTITENANT_CACHE_TAGS.overview}</code>, invalidation via{" "}
          <span className="font-medium">revalidateMultitenantScope()</span> — pas de second système de cache.
        </p>
        <Link href="/admin/multitenant" className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Retour pilotage →
        </Link>
      </section>
    </>
  );
}
