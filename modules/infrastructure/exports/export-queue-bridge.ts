import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { INFRA_JOB_TYPES } from "@/modules/infrastructure/constants/job-types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { enqueueInfrastructureJob } from "@/modules/infrastructure/server/repositories/infrastructure-job-repository";

export async function enqueueGenericExportJob(
  supabase: SupabaseClient<Database>,
  params: {
    createdBy: string;
    domainKey: string;
    payload: Json;
    idempotencyKey?: string | null;
  },
) {
  return enqueueInfrastructureJob(supabase, {
    queueKey: INFRA_QUEUE_KEYS.exports,
    domainKey: params.domainKey,
    jobType: INFRA_JOB_TYPES.exportGeneric,
    payload: params.payload,
    idempotencyKey: params.idempotencyKey ?? null,
    createdBy: params.createdBy,
    priority: 2,
  });
}
