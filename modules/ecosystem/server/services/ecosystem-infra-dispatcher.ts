import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { ECOSYSTEM_INFRA_JOB_TYPES } from "@/modules/ecosystem/constants/infrastructure-bridge";
import { executeEcosystemFederationDigest } from "@/modules/ecosystem/server/services/ecosystem-federation-digest";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchEcosystemInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case ECOSYSTEM_INFRA_JOB_TYPES.federationDigest:
      await executeEcosystemFederationDigest(admin, job);
      return;
    default:
      infraLogInfo("ecosystem.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
