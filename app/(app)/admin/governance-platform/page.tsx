import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { GovernancePlatformMonitoringToolbar } from "@/modules/governance-platform/components/dashboard/GovernancePlatformMonitoringToolbar";
import { GovernancePlatformOverviewMetrics } from "@/modules/governance-platform/components/dashboard/GovernancePlatformOverviewMetrics";
import { getGovernancePlatformOverview } from "@/modules/governance-platform/server/services/governance-platform-overview";

export default async function AdminGovernancePlatformHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["governance_platform"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getGovernancePlatformOverview(supabase);

  return (
    <>

      <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Gouvernance & maturité plateforme</h1>
        <p className="mt-1 text-sm text-gray-600">
          ADR, board architecture, standards engineering, dette technique et snapshots de maturité — reliés aux tenants,
          observabilité, IA, cloud et conformité sans refactor des moteurs métier.
        </p>
      </section>

      <GovernancePlatformMonitoringToolbar />

      <GovernancePlatformOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Ponts natifs</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/multitenant/governance" className="text-violet-900 hover:underline">
              Gouvernance multitenant
            </Link>
          </li>
          <li>
            <Link href="/admin/observability/governance" className="text-violet-900 hover:underline">
              Observabilité — gouvernance
            </Link>
          </li>
          <li>
            <Link href="/admin/ai" className="text-violet-900 hover:underline">
              IA / prédictif
            </Link>
          </li>
          <li>
            <Link href="/admin/cloud" className="text-violet-900 hover:underline">
              Cloud mondial
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance/governance" className="text-violet-900 hover:underline">
              Conformité — gouvernance
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
