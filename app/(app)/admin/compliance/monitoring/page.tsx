import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { ComplianceMonitoringToolbar } from "@/modules/compliance/components/dashboard/ComplianceMonitoringToolbar";

export default async function AdminComplianceMonitoringPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["compliance"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Monitoring conformité</h1>
        <p className="mt-1 text-sm text-gray-600">
          Orchestration via la file <span className="font-medium">erp_infrastructure_jobs</span> (
          <code className="rounded bg-gray-100 px-1">queue_key = compliance</code>
          ).
        </p>
      </section>

      <ComplianceMonitoringToolbar />

      <section className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
        <p>
          Pour la supervision globale des jobs :{" "}
          <Link href="/admin/global-dashboard" className="font-medium text-emerald-800 hover:underline">
            Tableau de bord global
          </Link>
          .
        </p>
      </section>
    </>
  );
}
