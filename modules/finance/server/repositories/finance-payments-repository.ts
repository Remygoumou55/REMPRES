import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listFinancePaymentAllocations(
  supabase: SupabaseClient<Database>,
  limit = 120,
): Promise<Database["public"]["Tables"]["finance_payment_allocations"]["Row"][]> {
  const { data, error } = await supabase
    .from("finance_payment_allocations")
    .select("*")
    .order("paid_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
