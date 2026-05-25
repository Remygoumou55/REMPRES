import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertExecutiveDashboardRead } from "@/modules/executive-dashboard/server";
import { buildExecutiveForecastBundle } from "@/modules/executive-dashboard/server/services/executive-forecast-service";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export default async function ExecutiveForecastPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  try {
    await assertExecutiveDashboardRead(user.id);
  } catch {
    redirect("/access-denied");
  }

  const supabase = getSupabaseServerClient();
  const bundle = await buildExecutiveForecastBundle(supabase);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Forecast exécutif"
        subtitle="Projections revenus, trésorerie, pipeline et charge ops — basées sur historique réel."
        actions={
          <Link href="/dashboard/executive" className="text-sm font-medium text-primary hover:underline">
            ← Centre exécutif
          </Link>
        }
      />
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs text-gray-500">Période {bundle.periodStart} · {bundle.forecastId}</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {bundle.rows.map((row) => (
            <div key={row.metricKey} className="rounded-lg border border-gray-100 bg-gray-50/80 p-4">
              <dt className="text-sm font-medium text-gray-700">{row.label}</dt>
              <dd className="mt-2 text-lg font-semibold tabular-nums">
                {row.projectedValue.toLocaleString("fr-FR")} GNF
              </dd>
              <dd className="text-xs text-gray-500">
                Baseline {row.baselineValue.toLocaleString("fr-FR")} · Δ {row.variancePct.toFixed(1)}% ·{" "}
                {row.horizon}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
