import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

/** Job serveur (cron) : recalcule une ligne `finance_cashflow_daily`. Service role uniquement. */
export async function runRefreshFinanceCashflowDaily(pDateIso: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.rpc("refresh_finance_cashflow_daily", { p_date: pDateIso });
  if (error) throw new Error(error.message);
}
