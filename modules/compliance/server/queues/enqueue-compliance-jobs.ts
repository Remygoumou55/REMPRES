import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { enqueueInfrastructureJobAdmin } from "@/modules/infrastructure/server/repositories/infrastructure-job-admin-repository";
import { COMPLIANCE_INFRA_JOB_TYPES } from "@/modules/compliance/constants/infrastructure-bridge";

export async function enqueueComplianceRiskScanJob(
  admin: SupabaseClient<Database>,
  params: { createdBy: string },
) {
  return enqueueInfrastructureJobAdmin(admin, {
    queueKey: INFRA_QUEUE_KEYS.compliance,
    domainKey: "compliance",
    jobType: COMPLIANCE_INFRA_JOB_TYPES.riskScan,
    payload: {},
    priority: 5,
    createdBy: params.createdBy,
    idempotencyKey: null,
  });
}
