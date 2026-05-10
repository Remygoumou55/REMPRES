import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { ComplianceMonitoringToolbar } from "@/modules/compliance/components/dashboard/ComplianceMonitoringToolbar";
import { ComplianceOverviewMetrics } from "@/modules/compliance/components/dashboard/ComplianceOverviewMetrics";
import { getComplianceOperationalOverview } from "@/modules/compliance/server/services/compliance-overview";

export default async function AdminComplianceHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["compliance"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getComplianceOperationalOverview(supabase);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/compliance", label: "Conformité" },
        ]}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Conformité entreprise</h1>
        <p className="mt-1 text-sm text-gray-600">
          Verrous fiscaux, périodes comptables immuables, rétention légale et détection de risques branchés sur le
          journal Finance (<code className="rounded bg-gray-100 px-1">post_finance_journal_batch</code>
          ).
        </p>
      </section>

      <ComplianceMonitoringToolbar />

      <ComplianceOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Accès rapides</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/compliance/periods" className="text-emerald-800 hover:underline">
              Périodes et statuts
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance/fiscal" className="text-emerald-800 hover:underline">
              Verrouillage fiscal annuel
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance/risks" className="text-emerald-800 hover:underline">
              Signaux de risque ouverts
            </Link>
          </li>
          <li>
            <Link href="/finance/enterprise/journal" className="text-emerald-800 hover:underline">
              Journal comptable Finance
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
