import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { CLOUD_INFRA_JOB_TYPES } from "@/modules/cloud/constants/infrastructure-bridge";
import { executeCloudOperationsDigest } from "@/modules/cloud/server/services/cloud-operations-digest";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchCloudInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case CLOUD_INFRA_JOB_TYPES.operationsDigest:
      await executeCloudOperationsDigest(admin, job);
      return;
    default:
      infraLogInfo("cloud.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
