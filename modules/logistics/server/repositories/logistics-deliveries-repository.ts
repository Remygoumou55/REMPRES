import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listLogisticsDeliveryOrders(
  supabase: SupabaseClient<Database>,
  limit = 80,
): Promise<Database["public"]["Tables"]["logistics_delivery_orders"]["Row"][]> {
  const { data, error } = await supabase
    .from("logistics_delivery_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
