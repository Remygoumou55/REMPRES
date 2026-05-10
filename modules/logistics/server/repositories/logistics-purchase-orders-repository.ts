import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listLogisticsPurchaseOrders(
  supabase: SupabaseClient<Database>,
  limit = 80,
): Promise<Database["public"]["Tables"]["logistics_purchase_orders"]["Row"][]> {
  const { data, error } = await supabase
    .from("logistics_purchase_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
