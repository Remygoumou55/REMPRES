import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminMultitenantObservabilityPage() {
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
          { href: "/admin/multitenant/observability", label: "Observabilité" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Observabilité tenant-aware</h1>
        <p className="mt-1 text-sm text-gray-600">
          Les corrélations restent sur le module observabilité ; le sweep multitenant peut agréger par tenant sans dupliquer les tables de santé.
        </p>
        <Link href="/admin/observability" className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Observabilité →
        </Link>
      </section>
    </>
  );
}
