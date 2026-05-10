import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminGovernancePlatformCompliancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["governance_platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/governance-platform", label: "Gouvernance plateforme" },
          { href: "/admin/governance-platform/compliance", label: "Conformité fédérée" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Compliance governance federation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Alignement avec conformité enterprise existante : snapshots légaux inchangés ; ce module porte les artefacts
          d&apos;architecture et standards auditables.
        </p>
        <Link href="/admin/compliance" className="mt-3 inline-flex text-sm font-medium text-violet-900 hover:underline">
          Console conformité →
        </Link>
      </section>
    </>
  );
}
