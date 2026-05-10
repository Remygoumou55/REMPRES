import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { EcosystemMonitoringToolbar } from "@/modules/ecosystem/components/dashboard/EcosystemMonitoringToolbar";

export default async function AdminEcosystemMonitoringPage() {
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
          { href: "/admin/ecosystem/monitoring", label: "Monitoring" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Monitoring écosystème</h1>
        <p className="mt-1 text-sm text-gray-600">
          File <code className="rounded bg-gray-100 px-1">ecosystem</code> sur la même orchestration Postgres que les autres domaines.
        </p>
      </section>

      <EcosystemMonitoringToolbar />

      <Link href="/admin/global-dashboard" className="inline-flex text-sm font-medium text-amber-800 hover:underline">
        Tableau global →
      </Link>
    </>
  );
}
