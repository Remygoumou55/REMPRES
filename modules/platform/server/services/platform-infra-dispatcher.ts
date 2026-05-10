import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { PLATFORM_INFRA_JOB_TYPES } from "@/modules/platform/constants/infrastructure-bridge";
import { executePlatformRegistryDigest } from "@/modules/platform/server/services/platform-registry-digest";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchPlatformInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case PLATFORM_INFRA_JOB_TYPES.registryDigest:
      await executePlatformRegistryDigest(admin, job);
      return;
    default:
      infraLogInfo("platform.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
