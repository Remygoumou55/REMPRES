import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { GOVERNANCE_PLATFORM_INFRA_JOB_TYPES } from "@/modules/governance-platform/constants/infrastructure-bridge";
import { executeGovernancePlatformMaturityDigest } from "@/modules/governance-platform/server/services/governance-platform-maturity-digest";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchGovernancePlatformInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case GOVERNANCE_PLATFORM_INFRA_JOB_TYPES.maturityDigest:
      await executeGovernancePlatformMaturityDigest(admin, job);
      return;
    default:
      infraLogInfo("governance_platform.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
