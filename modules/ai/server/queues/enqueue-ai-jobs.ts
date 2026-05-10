import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { enqueueInfrastructureJobAdmin } from "@/modules/infrastructure/server/repositories/infrastructure-job-admin-repository";
import { AI_INFRA_JOB_TYPES } from "@/modules/ai/constants/infrastructure-bridge";

export async function enqueueAiInsightPipelineJob(
  admin: SupabaseClient<Database>,
  params: { createdBy: string },
) {
  return enqueueInfrastructureJobAdmin(admin, {
    queueKey: INFRA_QUEUE_KEYS.ai,
    domainKey: "ai",
    jobType: AI_INFRA_JOB_TYPES.insightPipeline,
    payload: {},
    priority: 5,
    createdBy: params.createdBy,
    idempotencyKey: null,
  });
}
