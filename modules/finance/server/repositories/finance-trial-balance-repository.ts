import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type FinanceTrialBalanceViewRow = {
  account_id: string;
  account_code: string;
  account_label: string;
  account_type: string;
  debit_total_gnf: number;
  credit_total_gnf: number;
};

export async function listFinanceTrialBalance(
  supabase: SupabaseClient<Database>,
  limit = 500,
): Promise<FinanceTrialBalanceViewRow[]> {
  const { data, error } = await supabase
    .from("v_finance_trial_balance")
    .select("*")
    .order("account_code", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as FinanceTrialBalanceViewRow[];
}
