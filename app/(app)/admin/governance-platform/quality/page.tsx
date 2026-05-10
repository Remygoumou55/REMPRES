import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminGovernancePlatformQualityPage() {
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
          { href: "/admin/governance-platform/quality", label: "Qualité engineering" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Engineering quality intelligence</h1>
        <p className="mt-1 text-sm text-gray-600">
          Agrégation qualitative via digest batch et métriques futures branchées sur snapshots{" "}
          <span className="font-medium">erp_governance_maturity_snapshots</span>.
        </p>
        <Link href="/admin/governance-platform/analytics" className="mt-3 inline-flex text-sm font-medium text-violet-900 hover:underline">
          Analytics maturité →
        </Link>
      </section>
    </>
  );
}
