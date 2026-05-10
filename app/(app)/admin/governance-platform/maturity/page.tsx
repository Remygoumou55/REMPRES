import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminGovernancePlatformMaturityPage() {
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
          { href: "/admin/governance-platform/maturity", label: "Maturité" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Platform maturity cockpit</h1>
        <p className="mt-1 text-sm text-gray-600">
          Pilotage scores 0–100 par dimension ; ingestion via jobs digest ou saisies contrôlées — pont naturel vers qualité et
          observabilité.
        </p>
        <Link href="/admin/governance-platform" className="mt-3 inline-flex text-sm font-medium text-violet-900 hover:underline">
          Pilotage →
        </Link>
      </section>
    </>
  );
}
