import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listLogisticsWarehouses(
  supabase: SupabaseClient<Database>,
): Promise<Database["public"]["Tables"]["logistics_warehouses"]["Row"][]> {
  const { data, error } = await supabase
    .from("logistics_warehouses")
    .select("*")
    .eq("is_active", true)
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
