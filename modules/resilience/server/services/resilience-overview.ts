import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import type { ResilienceOperationalOverview } from "@/modules/resilience/types/domain";

export async function getResilienceOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<ResilienceOperationalOverview> {
  const [scenarios, runs, metrics, jobs] = await Promise.all([
    supabase.from("erp_resilience_scenarios").select("id", { count: "exact", head: true }),
    supabase.from("erp_resilience_validation_runs").select("id", { count: "exact", head: true }),
    supabase.from("erp_resilience_metric_snapshots").select("id", { count: "exact", head: true }),
    supabase
      .from("erp_infrastructure_jobs")
      .select("id", { count: "exact", head: true })
      .eq("queue_key", INFRA_QUEUE_KEYS.resilience)
      .eq("status", "pending"),
  ]);

  const errors = [scenarios.error, runs.error, metrics.error, jobs.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    scenariosCount: scenarios.count ?? 0,
    validationRunsCount: runs.count ?? 0,
    metricSnapshotsCount: metrics.count ?? 0,
    resiliencePendingJobs: jobs.count ?? 0,
  };
}
