import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export async function listLogisticsSuppliers(
  supabase: SupabaseClient<Database>,
  limit = 80,
): Promise<Database["public"]["Tables"]["logistics_suppliers"]["Row"][]> {
  const { data, error } = await supabase
    .from("logistics_suppliers")
    .select("*")
    .eq("is_active", true)
    .order("company_name", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
