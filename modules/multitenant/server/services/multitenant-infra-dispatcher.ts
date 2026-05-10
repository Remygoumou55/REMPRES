import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { MULTITENANT_INFRA_JOB_TYPES } from "@/modules/multitenant/constants/infrastructure-bridge";
import { executeMultitenantOrchestrationSweep } from "@/modules/multitenant/server/services/multitenant-orchestration-sweep";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchMultitenantInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case MULTITENANT_INFRA_JOB_TYPES.orchestrationSweep:
      await executeMultitenantOrchestrationSweep(admin, job);
      return;
    default:
      infraLogInfo("multitenant.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
