/**
 * Forecast layer — projections depuis historique réel (pas de fake).
 */

import { format, startOfMonth, subMonths } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { emitExecutiveForecastGenerated } from "@/lib/erp-core/events/integrations/executive-events";

export const EXECUTIVE_FORECAST_SOURCE = "executive-forecast-bloc3-v1" as const;

export type ExecutiveForecastRow = {
  metricKey: string;
  label: string;
  baselineValue: number;
  projectedValue: number;
  variancePct: number;
  horizon: "30d" | "90d" | "quarter";
};

export type ExecutiveForecastBundle = {
  source: typeof EXECUTIVE_FORECAST_SOURCE;
  forecastId: string;
  periodStart: string;
  rows: ExecutiveForecastRow[];
  generatedAt: string;
};

function toNum(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function sumSalesMonth(
  supabase: SupabaseClient<Database>,
  from: Date,
  to: Date,
): Promise<number> {
  const { data, error } = await supabase
    .from("sales")
    .select("total_amount_gnf")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString());
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((s, r) => s + toNum(r.total_amount_gnf), 0);
}

export async function buildExecutiveForecastBundle(
  supabase: SupabaseClient<Database>,
): Promise<ExecutiveForecastBundle> {
  const now = new Date();
  const periodStart = format(startOfMonth(now), "yyyy-MM-dd");

  const m0 = startOfMonth(now);
  const m1 = startOfMonth(subMonths(now, 1));
  const m2 = startOfMonth(subMonths(now, 2));
  const [rev0, rev1, rev2] = await Promise.all([
    sumSalesMonth(supabase, m0, startOfMonth(subMonths(now, -1))),
    sumSalesMonth(supabase, m1, m0),
    sumSalesMonth(supabase, m2, m1),
  ]);

  const avg3 = (rev0 + rev1 + rev2) / 3;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const runRate = dayOfMonth > 0 ? (rev0 / dayOfMonth) * daysInMonth : avg3;
  const revenueProjected = Math.round(Math.max(runRate, avg3));

  const [pipeline, tasksOpen, cashExpenses] = await Promise.all([
    supabase
      .from("crm_opportunities")
      .select("amount_estimated_gnf")
      .is("deleted_at", null),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .in("status", ["todo", "in_progress"]),
    supabase
      .from("expenses")
      .select("amount_gnf")
      .gte("created_at", m0.toISOString()),
  ]);

  const pipelineValue = (pipeline.data ?? []).reduce(
    (s, o) => s + toNum(o.amount_estimated_gnf),
    0,
  );
  const expenseMonth = (cashExpenses.data ?? []).reduce((s, e) => s + toNum(e.amount_gnf), 0);
  const expenseProjected = Math.round(expenseMonth * 1.05);
  const cashProjected = revenueProjected - expenseProjected;
  const opsLoad = tasksOpen.count ?? 0;
  const opsProjected = Math.max(0, Math.round(opsLoad * 0.85));

  const rows: ExecutiveForecastRow[] = [
    {
      metricKey: "revenue",
      label: "Revenus (fin de mois)",
      baselineValue: rev0,
      projectedValue: revenueProjected,
      variancePct: rev0 > 0 ? ((revenueProjected - rev0) / rev0) * 100 : 0,
      horizon: "30d",
    },
    {
      metricKey: "cashflow",
      label: "Trésorerie projetée",
      baselineValue: rev0 - expenseMonth,
      projectedValue: cashProjected,
      variancePct:
        rev0 - expenseMonth !== 0
          ? ((cashProjected - (rev0 - expenseMonth)) / Math.abs(rev0 - expenseMonth)) * 100
          : 0,
      horizon: "30d",
    },
    {
      metricKey: "pipeline",
      label: "Pipeline CRM (stock)",
      baselineValue: pipelineValue,
      projectedValue: Math.round(pipelineValue * 0.7),
      variancePct: -30,
      horizon: "90d",
    },
    {
      metricKey: "ops_backlog",
      label: "Charge ops projetée",
      baselineValue: opsLoad,
      projectedValue: opsProjected,
      variancePct: opsLoad > 0 ? ((opsProjected - opsLoad) / opsLoad) * 100 : 0,
      horizon: "quarter",
    },
  ];

  return {
    source: EXECUTIVE_FORECAST_SOURCE,
    forecastId: `exec-forecast-${periodStart}`,
    periodStart,
    rows,
    generatedAt: new Date().toISOString(),
  };
}

export async function persistExecutiveForecasts(
  userId: string,
  bundle: ExecutiveForecastBundle,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  for (const row of bundle.rows) {
    const key = `${bundle.forecastId}_${row.metricKey}`;
    const { error } = await supabase.from("erp_executive_forecasts").upsert(
      {
        forecast_key: key,
        metric_key: row.metricKey,
        horizon: row.horizon,
        baseline_value: row.baselineValue,
        projected_value: row.projectedValue,
        variance_pct: row.variancePct,
        confidence: 0.75,
        assumptions: { source: bundle.source, period_start: bundle.periodStart },
        created_by: userId,
      },
      { onConflict: "forecast_key" },
    );
    if (error) console.warn("[executive-forecast]", error.message);
  }
}

export async function generateExecutiveForecastReport(userId: string): Promise<ExecutiveForecastBundle> {
  const supabase = getSupabaseServerClient();
  const bundle = await buildExecutiveForecastBundle(supabase);
  await Promise.all([
    persistExecutiveForecasts(userId, bundle),
    emitExecutiveForecastGenerated({
      actorUserId: userId,
      forecastId: bundle.forecastId,
      metricCount: bundle.rows.length,
    }),
  ]);
  return bundle;
}
