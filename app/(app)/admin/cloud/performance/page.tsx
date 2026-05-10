import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminCloudPerformancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["cloud"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/cloud", label: "Cloud mondial" },
          { href: "/admin/cloud/performance", label: "Performance" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Performance mondiale</h1>
        <p className="mt-1 text-sm text-gray-600">
          Latence et capacité suivies via digest cloud et métadonnées régions ; le profiling applicatif reste dans
          observabilité / infra existante.
        </p>
        <Link href="/admin/multitenant/monitoring" className="mt-3 inline-flex text-sm font-medium text-indigo-800 hover:underline">
          Monitoring multitenant →
        </Link>
      </section>
    </>
  );
}
