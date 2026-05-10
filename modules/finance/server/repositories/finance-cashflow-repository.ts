import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { FinanceCashflowDailyRow } from "@/modules/finance/types/domain";

export async function getFinanceCashflowDailyRange(
  supabase: SupabaseClient<Database>,
  from: string,
  to: string,
): Promise<FinanceCashflowDailyRow[]> {
  const { data, error } = await supabase
    .from("finance_cashflow_daily")
    .select("*")
    .gte("snapshot_date", from)
    .lte("snapshot_date", to)
    .order("snapshot_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
