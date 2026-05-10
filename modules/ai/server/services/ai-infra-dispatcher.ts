import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { AI_INFRA_JOB_TYPES } from "@/modules/ai/constants/infrastructure-bridge";
import { executeAiInsightPipeline } from "@/modules/ai/server/services/ai-insight-pipeline";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchAiInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case AI_INFRA_JOB_TYPES.insightPipeline:
      await executeAiInsightPipeline(admin, job);
      return;
    default:
      infraLogInfo("ai.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
