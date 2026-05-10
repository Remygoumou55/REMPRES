import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminResilienceOrchestrationPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/resilience", label: "Résilience" },
          { href: "/admin/resilience/orchestration", label: "Orchestration" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Orchestration stress engine</h1>
        <p className="mt-1 text-sm text-gray-600">
          Validation sagas et files automation/compliance existantes ; résultats dans{" "}
          <span className="font-medium">erp_resilience_validation_runs</span>.
        </p>
        <Link href="/admin/automation" className="mt-3 inline-flex text-sm font-medium text-amber-950 hover:underline">
          Automation →
        </Link>
      </section>
    </>
  );
}
