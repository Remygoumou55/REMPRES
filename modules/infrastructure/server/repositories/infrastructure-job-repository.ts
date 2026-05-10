import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

export async function enqueueInfrastructureJob(
  supabase: SupabaseClient<Database>,
  params: {
    queueKey: string;
    domainKey: string;
    jobType: string;
    payload?: Json;
    idempotencyKey?: string | null;
    priority?: number;
    runAfterIso?: string | null;
    maxAttempts?: number;
    createdBy: string;
    tenantId?: string | null;
  },
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from("erp_infrastructure_jobs")
    .insert({
      queue_key: params.queueKey,
      domain_key: params.domainKey,
      job_type: params.jobType,
      payload: params.payload ?? {},
      idempotency_key: params.idempotencyKey ?? null,
      priority: params.priority ?? 0,
      run_after: params.runAfterIso ?? new Date().toISOString(),
      max_attempts: params.maxAttempts ?? 5,
      created_by: params.createdBy,
      tenant_id: params.tenantId ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { error: "duplicate_idempotency_key" };
    }
    return { error: error.message };
  }
  if (!data?.id) return { error: "enqueue_failed" };
  return { id: data.id };
}
