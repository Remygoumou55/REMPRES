import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { AiMonitoringToolbar } from "@/modules/ai/components/dashboard/AiMonitoringToolbar";

export default async function AdminAiMonitoringPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/ai", label: "AI" },
          { href: "/admin/ai/monitoring", label: "Monitoring" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Monitoring AI</h1>
        <p className="mt-1 text-sm text-gray-600">
          Queue dédiée <code className="rounded bg-gray-100 px-1">ai</code> sur{" "}
          <span className="font-medium">erp_infrastructure_jobs</span>.
        </p>
      </section>

      <AiMonitoringToolbar />

      <Link href="/admin/global-dashboard" className="inline-flex text-sm font-medium text-violet-800 hover:underline">
        Tableau de bord global →
      </Link>
    </>
  );
}
