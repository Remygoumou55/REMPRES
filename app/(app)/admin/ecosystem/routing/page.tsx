import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminEcosystemRoutingPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ecosystem"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/ecosystem", label: "Écosystème" },
          { href: "/admin/ecosystem/routing", label: "Routage" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Routage connecteurs distribué</h1>
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-medium">erp_ecosystem_connector_routes</span> : routes globales (<span className="font-medium">tenant_id</span>{" "}
          null) ou par tenant ; priorités et activation sans nouveau proxy réseau.
        </p>
        <Link href="/admin/multitenant/tenants" className="mt-3 inline-flex text-sm font-medium text-amber-800 hover:underline">
          Tenants →
        </Link>
      </section>
    </>
  );
}
