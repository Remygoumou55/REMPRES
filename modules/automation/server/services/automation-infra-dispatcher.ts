import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { AUTOMATION_INFRA_JOB_TYPES } from "@/modules/automation/constants/infrastructure-bridge";
import { executeAutomationEscalationSweep } from "@/modules/automation/server/services/automation-escalation-sweep";
import { executeAutomationScheduleSweep } from "@/modules/automation/server/services/automation-schedule-sweep";
import { executeAutomationWorkflowRunTick } from "@/modules/automation/server/services/automation-workflow-run-tick";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function dispatchAutomationInfrastructureJob(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  switch (job.job_type) {
    case AUTOMATION_INFRA_JOB_TYPES.workflowRunTick:
      await executeAutomationWorkflowRunTick(admin, job);
      return;
    case AUTOMATION_INFRA_JOB_TYPES.scheduleSweep:
      await executeAutomationScheduleSweep(admin, job);
      return;
    case AUTOMATION_INFRA_JOB_TYPES.escalationSweep:
      await executeAutomationEscalationSweep(admin, job);
      return;
    default:
      infraLogInfo("automation.infra_job.unhandled", { jobType: job.job_type, id: job.id });
  }
}
