import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { RESILIENCE_INFRA_JOB_TYPES } from "@/modules/resilience/constants/infrastructure-bridge";
import { executeResilienceReliabilityDigest } from "@/modules/resilience/server/services/resilience-reliability-digest";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchResilienceInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case RESILIENCE_INFRA_JOB_TYPES.reliabilityDigest:
      await executeResilienceReliabilityDigest(admin, job);
      return;
    default:
      infraLogInfo("resilience.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
