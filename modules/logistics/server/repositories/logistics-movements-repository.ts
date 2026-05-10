import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listRecentLogisticsMovements(
  supabase: SupabaseClient<Database>,
  limit = 120,
): Promise<Database["public"]["Tables"]["logistics_stock_movements"]["Row"][]> {
  const { data, error } = await supabase
    .from("logistics_stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
