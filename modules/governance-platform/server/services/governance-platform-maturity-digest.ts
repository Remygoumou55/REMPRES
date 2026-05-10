import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

/**
 * Digest batch maturité / qualité gouvernance — agrège les registres sans toucher aux domaines métier.
 */
export async function executeGovernancePlatformMaturityDigest(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  const [adr, board, standards, debt, maturity, opsEvents] = await Promise.all([
    admin.from("erp_governance_architecture_decisions").select("id", { count: "exact", head: true }),
    admin.from("erp_governance_board_topics").select("id", { count: "exact", head: true }),
    admin.from("erp_governance_standards_registry").select("id", { count: "exact", head: true }),
    admin.from("erp_governance_technical_debt_entries").select("id", { count: "exact", head: true }),
    admin.from("erp_governance_maturity_snapshots").select("id", { count: "exact", head: true }),
    admin.from("erp_governance_platform_operations_events").select("id", { count: "exact", head: true }),
  ]);

  const err = [adr.error, board.error, standards.error, debt.error, maturity.error, opsEvents.error].find(Boolean);
  if (err) throw new Error(err.message);

  const payload = {
    adr: adr.count ?? 0,
    board_topics: board.count ?? 0,
    standards: standards.count ?? 0,
    technical_debt: debt.count ?? 0,
    maturity_snapshots: maturity.count ?? 0,
    governance_platform_events: opsEvents.count ?? 0,
    scoped_tenant_id: job.tenant_id,
  };

  const { error: insertErr } = await admin.from("erp_governance_platform_operations_events").insert({
    tenant_id: job.tenant_id,
    event_kind: "governance_platform.maturity_digest",
    payload,
    correlation_id: job.id,
  });

  if (insertErr) throw new Error(insertErr.message);

  infraLogInfo("governance_platform.maturity_digest.complete", {
    jobId: job.id,
    ...payload,
  });
}
