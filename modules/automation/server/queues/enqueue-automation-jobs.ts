import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { enqueueInfrastructureJobAdmin } from "@/modules/infrastructure/server/repositories/infrastructure-job-admin-repository";
import { AUTOMATION_INFRA_JOB_TYPES } from "@/modules/automation/constants/infrastructure-bridge";

export async function enqueueAutomationScheduleSweepJob(
  admin: SupabaseClient<Database>,
  params: { createdBy: string },
) {
  return enqueueInfrastructureJobAdmin(admin, {
    queueKey: INFRA_QUEUE_KEYS.automation,
    domainKey: "automation",
    jobType: AUTOMATION_INFRA_JOB_TYPES.scheduleSweep,
    payload: {},
    priority: 3,
    createdBy: params.createdBy,
    idempotencyKey: null,
  });
}

export async function enqueueAutomationEscalationSweepJob(
  admin: SupabaseClient<Database>,
  params: { createdBy: string },
) {
  return enqueueInfrastructureJobAdmin(admin, {
    queueKey: INFRA_QUEUE_KEYS.automation,
    domainKey: "automation",
    jobType: AUTOMATION_INFRA_JOB_TYPES.escalationSweep,
    payload: {},
    priority: 6,
    createdBy: params.createdBy,
    idempotencyKey: null,
  });
}
