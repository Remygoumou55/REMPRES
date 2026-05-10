import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

/**
 * Point d’extension pour quotas / analytics tenant / corrélations observabilité.
 * Phase 1 : noop métier — marque la voie pour orchestrations distribuées sans toucher aux domaines existants.
 */
export async function executeMultitenantOrchestrationSweep(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  const { count, error } = await admin.from("erp_tenants").select("id", { count: "exact", head: true });

  if (error) throw new Error(error.message);

  infraLogInfo("multitenant.orchestration_sweep.complete", {
    jobId: job.id,
    tenantRows: count ?? 0,
    scopedTenantId: job.tenant_id,
  });
}
