import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";

export default async function AdminAutomationGovernancePage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["automation"]);
  if (!perms.canRead) redirect("/access-denied");

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/automation", label: "Automation" },
          { href: "/admin/automation/governance", label: "Gouvernance" },
        ]}
      />
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Gouvernance automation</h1>
        <p className="mt-1 text-sm text-gray-600">
          Les dépassements SLA créent une alerte <span className="font-medium">governance_alerts</span> et une ligne{" "}
          <span className="font-medium">erp_automation_escalations</span>, traitées par les processus existants.
        </p>
      </section>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
        <p>
          Les actions sensibles côté automation sont journalisées dans{" "}
          <span className="font-medium">governance_audit_events</span> lorsque vous déclenchez des sweeps depuis le
          pilotage.
        </p>
        <ul className="list-inside list-disc space-y-2">
          <li>
            <Link href="/admin/alerts" className="text-indigo-700 hover:underline">
              Alertes gouvernance
            </Link>
          </li>
          <li>
            <Link href="/admin/approvals" className="text-indigo-700 hover:underline">
              Approbations
            </Link>
          </li>
          <li>
            <Link href="/admin/audit" className="text-indigo-700 hover:underline">
              Audit
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
