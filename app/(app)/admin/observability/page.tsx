import Link from "next/link";
import { redirect } from "next/navigation";
import { GovernanceBreadcrumb } from "@/components/governance/layout/GovernanceBreadcrumb";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { ObservabilityMonitoringToolbar } from "@/modules/observability/components/dashboard/ObservabilityMonitoringToolbar";
import { ObservabilityOverviewMetrics } from "@/modules/observability/components/dashboard/ObservabilityOverviewMetrics";
import { getObservabilityOperationalOverview } from "@/modules/observability/server/services/observability-overview";

export default async function AdminObservabilityHubPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["observability"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const overview = await getObservabilityOperationalOverview(supabase);

  return (
    <>
      <GovernanceBreadcrumb
        items={[
          { href: "/dashboard", label: "Accueil" },
          { href: "/admin/observability", label: "Observabilité" },
        ]}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Observabilité & intelligence risque</h1>
        <p className="mt-1 text-sm text-gray-600">
          Agrégation multi-domaines (files, conformité, automation, gouvernance), anomalies, incidents corrélés et traces
          légères — sans doubler le moteur analytics métier.
        </p>
      </section>

      <ObservabilityMonitoringToolbar />

      <ObservabilityOverviewMetrics overview={overview} />

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-sm text-gray-700">
        <div className="font-medium text-gray-900">Liens utiles</div>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <Link href="/admin/intelligence" className="text-sky-800 hover:underline">
              Intelligence entreprise
            </Link>
          </li>
          <li>
            <Link href="/admin/compliance" className="text-sky-800 hover:underline">
              Conformité
            </Link>
          </li>
          <li>
            <Link href="/admin/automation" className="text-sky-800 hover:underline">
              Automation
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
