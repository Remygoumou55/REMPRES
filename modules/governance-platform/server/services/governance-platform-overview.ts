import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import type { GovernancePlatformOverview } from "@/modules/governance-platform/types/domain";

export async function getGovernancePlatformOverview(
  supabase: SupabaseClient<Database>,
): Promise<GovernancePlatformOverview> {
  const [adr, board, standards, debt, maturity, jobs] = await Promise.all([
    supabase.from("erp_governance_architecture_decisions").select("id", { count: "exact", head: true }),
    supabase.from("erp_governance_board_topics").select("id", { count: "exact", head: true }),
    supabase.from("erp_governance_standards_registry").select("id", { count: "exact", head: true }),
    supabase.from("erp_governance_technical_debt_entries").select("id", { count: "exact", head: true }),
    supabase.from("erp_governance_maturity_snapshots").select("id", { count: "exact", head: true }),
    supabase
      .from("erp_infrastructure_jobs")
      .select("id", { count: "exact", head: true })
      .eq("queue_key", INFRA_QUEUE_KEYS.governancePlatform)
      .eq("status", "pending"),
  ]);

  const errors = [adr.error, board.error, standards.error, debt.error, maturity.error, jobs.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    adrCount: adr.count ?? 0,
    boardTopicsCount: board.count ?? 0,
    standardsCount: standards.count ?? 0,
    technicalDebtCount: debt.count ?? 0,
    maturitySnapshotsCount: maturity.count ?? 0,
    governancePlatformPendingJobs: jobs.count ?? 0,
  };
}
