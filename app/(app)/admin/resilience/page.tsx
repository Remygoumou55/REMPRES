import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { ResilienceMonitoringToolbar } from "@/modules/resilience/components/dashboard/ResilienceMonitoringToolbar";
import { ResilienceOverviewMetrics } from "@/modules/resilience/components/dashboard/ResilienceOverviewMetrics";
import { getResilienceOperationalOverview } from "@/modules/resilience/server/services/resilience-overview";

export default async function AdminResilienceHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["resilience"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getResilienceOperationalOverview(supabase);

  return (
    <>

      <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Tests massifs & résilience enterprise</h1>
        <p className="mt-1 text-sm text-gray-600">
          Scénarios, runs de validation et métriques SLA branchés sur l&apos;infra jobs — pont vers observabilité, cloud,
          multitenant et gouvernance sans second bus temps réel.
        </p>
      </section>

      <ResilienceMonitoringToolbar />

      <ResilienceOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Ponts natifs</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/observability" className="text-amber-950 hover:underline">
              Observabilité
            </Link>
          </li>
          <li>
            <Link href="/admin/cloud/recovery" className="text-amber-950 hover:underline">
              Recovery cloud
            </Link>
          </li>
          <li>
            <Link href="/admin/multitenant/recovery" className="text-amber-950 hover:underline">
              Recovery multitenant
            </Link>
          </li>
          <li>
            <Link href="/admin/governance-platform" className="text-amber-950 hover:underline">
              Gouvernance plateforme
            </Link>
          </li>
          <li>
            <Link href="/admin/ai" className="text-amber-950 hover:underline">
              IA
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
