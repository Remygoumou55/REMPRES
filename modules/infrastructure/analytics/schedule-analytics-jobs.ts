import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_JOB_TYPES } from "@/modules/infrastructure/constants/job-types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { enqueueInfrastructureJob } from "@/modules/infrastructure/server/repositories/infrastructure-job-repository";

/** Planifie un digest RH analytics via la file globale (sans bypasser `INTERNAL_ANALYTICS_SECRET`). */
export async function scheduleRhDeptKpisDigestJob(
  supabase: SupabaseClient<Database>,
  params: {
    createdBy: string;
    idempotencyKey?: string | null;
  },
) {
  const day = new Date().toISOString().slice(0, 10);
  return enqueueInfrastructureJob(supabase, {
    queueKey: INFRA_QUEUE_KEYS.analytics,
    domainKey: "rh",
    jobType: INFRA_JOB_TYPES.analyticsRhDigestRefresh,
    createdBy: params.createdBy,
    idempotencyKey: params.idempotencyKey ?? `rh_digest_${day}`,
    priority: 5,
  });
}
