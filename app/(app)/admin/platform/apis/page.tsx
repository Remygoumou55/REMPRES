import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminPlatformApisPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/platform", label: "Plateforme" },
          { href: "/admin/platform/apis", label: "APIs partenaires" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">APIs partenaires</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gouvernance via permissions module <span className="font-medium">platform</span> et RLS tenant ; pas de nouvelle couche auth globale.
        </p>
        <Link href="/admin/platform/integrations" className="mt-3 inline-flex text-sm font-medium text-cyan-800 hover:underline">
          Intégrations →
        </Link>
      </section>
    </>
  );
}
