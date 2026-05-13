import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminGovernancePlatformReliabilityPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["governance_platform"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Reliability governance</h1>
        <p className="mt-1 text-sm text-gray-600">
          Cadre SLO / erreurs piloté depuis observabilité ; ici le périmètre décisions et politiques fiabilité sans second
          régistre incidents.
        </p>
        <Link href="/admin/observability/health" className="mt-3 inline-flex text-sm font-medium text-violet-900 hover:underline">
          Santé observabilité →
        </Link>
      </section>
    </>
  );
}
