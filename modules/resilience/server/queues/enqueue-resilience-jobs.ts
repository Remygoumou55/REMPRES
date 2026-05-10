import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { enqueueInfrastructureJobAdmin } from "@/modules/infrastructure/server/repositories/infrastructure-job-admin-repository";
import { RESILIENCE_INFRA_JOB_TYPES } from "@/modules/resilience/constants/infrastructure-bridge";

export async function enqueueResilienceReliabilityDigestJob(
  admin: SupabaseClient<Database>,
  params: { createdBy: string; tenantId?: string | null },
) {
  return enqueueInfrastructureJobAdmin(admin, {
    queueKey: INFRA_QUEUE_KEYS.resilience,
    domainKey: "resilience",
    jobType: RESILIENCE_INFRA_JOB_TYPES.reliabilityDigest,
    payload: {},
    priority: 4,
    createdBy: params.createdBy,
    tenantId: params.tenantId ?? null,
    idempotencyKey: null,
  });
}
