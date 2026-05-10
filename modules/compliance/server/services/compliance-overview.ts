import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type ComplianceOperationalOverview = {
  accountingPeriods: number;
  fiscalLocksActive: number;
  openRiskSignals: number;
  snapshots24h: number;
  retentionPoliciesActive: number;
};

export async function getComplianceOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<ComplianceOperationalOverview> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [periods, locks, risks, snaps, retention] = await Promise.all([
    supabase.from("erp_compliance_accounting_periods").select("id", { count: "exact", head: true }),
    supabase
      .from("erp_compliance_fiscal_locks")
      .select("legal_entity_key", { count: "exact", head: true })
      .eq("journal_locked", true),
    supabase
      .from("erp_compliance_risk_signals")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("erp_compliance_snapshots")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("erp_compliance_retention_policies")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const errors = [periods.error, locks.error, risks.error, snaps.error, retention.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    accountingPeriods: periods.count ?? 0,
    fiscalLocksActive: locks.count ?? 0,
    openRiskSignals: risks.count ?? 0,
    snapshots24h: snaps.count ?? 0,
    retentionPoliciesActive: retention.count ?? 0,
  };
}
