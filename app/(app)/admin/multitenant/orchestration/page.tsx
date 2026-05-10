import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { MULTITENANT_INFRA_JOB_TYPES } from "@/modules/multitenant/constants/infrastructure-bridge";

export default async function AdminMultitenantOrchestrationPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["multitenant"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/multitenant", label: "Multi-tenant" },
          { href: "/admin/multitenant/orchestration", label: "Orchestration" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Orchestration distribuée</h1>
        <p className="mt-1 text-sm text-gray-600">
          Journal <span className="font-medium">erp_tenant_orchestration_events</span> ; job{" "}
          <code className="rounded bg-gray-100 px-1">{MULTITENANT_INFRA_JOB_TYPES.orchestrationSweep}</code> traité par le worker infra existant.
        </p>
        <Link href="/admin/multitenant/monitoring" className="mt-3 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Monitoring →
        </Link>
      </section>
    </>
  );
}
