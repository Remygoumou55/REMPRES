import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

/** Agrège registres résilience et trace un événement append-only (workers externes peuvent étendre les drills). */
export async function executeResilienceReliabilityDigest(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  const [scenarios, runs, metrics, opsEvents] = await Promise.all([
    admin.from("erp_resilience_scenarios").select("id", { count: "exact", head: true }),
    admin.from("erp_resilience_validation_runs").select("id", { count: "exact", head: true }),
    admin.from("erp_resilience_metric_snapshots").select("id", { count: "exact", head: true }),
    admin.from("erp_resilience_platform_operations_events").select("id", { count: "exact", head: true }),
  ]);

  const err = [scenarios.error, runs.error, metrics.error, opsEvents.error].find(Boolean);
  if (err) throw new Error(err.message);

  const payload = {
    scenarios: scenarios.count ?? 0,
    validation_runs: runs.count ?? 0,
    metric_snapshots: metrics.count ?? 0,
    resilience_platform_events: opsEvents.count ?? 0,
    scoped_tenant_id: job.tenant_id,
  };

  const { error: insertErr } = await admin.from("erp_resilience_platform_operations_events").insert({
    tenant_id: job.tenant_id,
    event_kind: "resilience.reliability_digest",
    payload,
    correlation_id: job.id,
  });

  if (insertErr) throw new Error(insertErr.message);

  infraLogInfo("resilience.reliability_digest.complete", {
    jobId: job.id,
    ...payload,
  });
}
