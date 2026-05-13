import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminGovernancePlatformStandardsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["governance_platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Engineering standards governance</h1>
        <p className="mt-1 text-sm text-gray-600">
          Registre <span className="font-medium">erp_governance_standards_registry</span> avec niveaux advisory / mandatory /
          certification — mutations réservées aux opérateurs plateforme (
          <span className="font-medium">is_governance_platform_operator</span>
          ).
        </p>
        <Link href="/admin/governance-platform/debt" className="mt-3 inline-flex text-sm font-medium text-violet-900 hover:underline">
          Dette technique →
        </Link>
      </section>
    </>
  );
}
