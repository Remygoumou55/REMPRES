import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { computeRetryDelayMs } from "@/modules/infrastructure/utils/retry-policy";

/** Enqueue avec service_role (workers / orchestrateurs internes). */
export async function enqueueInfrastructureJobAdmin(
  admin: SupabaseClient<Database>,
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
  const { data, error } = await admin
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
    if (error.code === "23505") return { error: "duplicate_idempotency_key" };
    return { error: error.message };
  }
  if (!data?.id) return { error: "enqueue_failed" };
  return { id: data.id };
}

export async function claimInfrastructureJobsAdmin(
  admin: SupabaseClient<Database>,
  batchLimit = 10,
): Promise<InfrastructureJobRow[]> {
  const { data, error } = await admin.rpc("claim_infrastructure_jobs", {
    p_batch_limit: batchLimit,
  });

  if (error) throw new Error(error.message);
  return (data ?? []) as InfrastructureJobRow[];
}

export async function completeInfrastructureJobAdmin(
  admin: SupabaseClient<Database>,
  jobId: string,
): Promise<void> {
  const { error } = await admin
    .from("erp_infrastructure_jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
      last_error: null,
    })
    .eq("id", jobId);

  if (error) throw new Error(error.message);
}

export async function rescheduleOrFailInfrastructureJobAdmin(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
  errorMessage: string,
): Promise<void> {
  const terminal = job.attempts >= job.max_attempts;
  const msg = errorMessage.slice(0, 4000);

  if (terminal) {
    const { error } = await admin
      .from("erp_infrastructure_jobs")
      .update({
        status: "failed",
        last_error: msg,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", job.id);
    if (error) throw new Error(error.message);
    return;
  }

  const runAfter = new Date(Date.now() + computeRetryDelayMs(job.attempts)).toISOString();
  const { error } = await admin
    .from("erp_infrastructure_jobs")
    .update({
      status: "pending",
      last_error: msg,
      locked_at: null,
      locked_by: null,
      run_after: runAfter,
    })
    .eq("id", job.id);

  if (error) throw new Error(error.message);
}
