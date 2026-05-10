import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type AiOperationalOverview = {
  insights24h: number;
  recommendationsPending: number;
  forecastArtifacts24h: number;
  pipelineRuns24h: number;
};

export async function getAiOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<AiOperationalOverview> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [insights, recs, forecasts, runs] = await Promise.all([
    supabase.from("erp_ai_insights").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("erp_ai_recommendations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("erp_ai_forecast_artifacts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabase.from("erp_ai_pipeline_runs").select("id", { count: "exact", head: true }).gte("started_at", since),
  ]);

  const errors = [insights.error, recs.error, forecasts.error, runs.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    insights24h: insights.count ?? 0,
    recommendationsPending: recs.count ?? 0,
    forecastArtifacts24h: forecasts.count ?? 0,
    pipelineRuns24h: runs.count ?? 0,
  };
}
