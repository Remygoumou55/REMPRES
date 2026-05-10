import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { FinanceAccountRow } from "@/modules/finance/types/domain";

export async function listActiveFinanceAccounts(
  supabase: SupabaseClient<Database>,
): Promise<FinanceAccountRow[]> {
  const { data, error } = await supabase
    .from("finance_accounts")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
