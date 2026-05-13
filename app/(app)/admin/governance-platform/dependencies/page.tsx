import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminGovernancePlatformDependenciesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["governance_platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Dependency governance engine</h1>
        <p className="mt-1 text-sm text-gray-600">
          Phase 1 : rattachement conceptuel aux standards et au registre plugins marketplace ; pas de scan SBOM dupliqué dans
          le runtime ERP.
        </p>
        <Link href="/admin/platform/marketplace" className="mt-3 inline-flex text-sm font-medium text-violet-900 hover:underline">
          Marketplace plateforme →
        </Link>
      </section>
    </>
  );
}
