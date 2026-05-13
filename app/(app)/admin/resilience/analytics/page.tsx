import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceAnalyticsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Recovery analytics & simulation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Historiques runs et snapshots pour scoring stabilité ; analytics métier restent dans les modules domaine existants.
        </p>
        <Link href="/admin/observability/predictive" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          Observabilité prédictive →
        </Link>
      </section>
    </>
  );
}
