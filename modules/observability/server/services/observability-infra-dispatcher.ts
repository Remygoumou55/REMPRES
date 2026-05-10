import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { OBSERVABILITY_INFRA_JOB_TYPES } from "@/modules/observability/constants/infrastructure-bridge";
import { executeObservabilityHealthDigest } from "@/modules/observability/server/services/observability-health-digest";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchObservabilityInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case OBSERVABILITY_INFRA_JOB_TYPES.healthDigest:
      await executeObservabilityHealthDigest(admin, job);
      return;
    default:
      infraLogInfo("observability.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
