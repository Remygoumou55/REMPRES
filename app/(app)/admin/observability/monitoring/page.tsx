import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { ObservabilityMonitoringToolbar } from "@/modules/observability/components/dashboard/ObservabilityMonitoringToolbar";

export default async function AdminObservabilityMonitoringPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["observability"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Orchestration monitoring</h1>
        <p className="mt-1 text-sm text-gray-600">
          Digest branché sur la file <code className="rounded bg-gray-100 px-1">observability</code> (
          <span className="font-medium">erp_infrastructure_jobs</span>
          ).
        </p>
      </section>

      <ObservabilityMonitoringToolbar />

      <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
        <Link href="/admin/global-dashboard" className="font-medium text-sky-800 hover:underline">
          Tableau de bord global →
        </Link>
      </section>
    </>
  );
}
