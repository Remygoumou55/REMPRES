import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { enqueueInfrastructureJobAdmin } from "@/modules/infrastructure/server/repositories/infrastructure-job-admin-repository";
import { OBSERVABILITY_INFRA_JOB_TYPES } from "@/modules/observability/constants/infrastructure-bridge";

export async function enqueueObservabilityHealthDigestJob(
  admin: SupabaseClient<Database>,
  params: { createdBy: string },
) {
  return enqueueInfrastructureJobAdmin(admin, {
    queueKey: INFRA_QUEUE_KEYS.observability,
    domainKey: "observability",
    jobType: OBSERVABILITY_INFRA_JOB_TYPES.healthDigest,
    payload: {},
    priority: 4,
    createdBy: params.createdBy,
    idempotencyKey: null,
  });
}
