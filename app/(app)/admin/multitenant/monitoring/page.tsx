import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { MultitenantMonitoringToolbar } from "@/modules/multitenant/components/dashboard/MultitenantMonitoringToolbar";

export default async function AdminMultitenantMonitoringPage() {
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
          { href: "/admin/multitenant/monitoring", label: "Monitoring" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Monitoring</h1>
        <p className="mt-1 text-sm text-gray-600">
          Enfilez un sweep depuis la barre ci-dessous ; suivi des jobs sur le tableau global infrastructure.
        </p>
      </section>

      <MultitenantMonitoringToolbar />

      <Link href="/admin/global-dashboard" className="inline-flex text-sm font-medium text-emerald-800 hover:underline">
        Tableau global →
      </Link>
    </>
  );
}
