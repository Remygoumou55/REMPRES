import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { COMPLIANCE_INFRA_JOB_TYPES } from "@/modules/compliance/constants/infrastructure-bridge";
import { executeComplianceRiskScan } from "@/modules/compliance/server/services/compliance-risk-scan";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchComplianceInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case COMPLIANCE_INFRA_JOB_TYPES.riskScan:
      await executeComplianceRiskScan(admin, job);
      return;
    default:
      infraLogInfo("compliance.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
