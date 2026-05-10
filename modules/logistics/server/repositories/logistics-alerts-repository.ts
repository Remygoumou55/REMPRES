import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { LogisticsStockAlertViewRow } from "@/modules/logistics/types/domain";

export async function listLogisticsStockAlerts(
  supabase: SupabaseClient<Database>,
  limit = 150,
): Promise<LogisticsStockAlertViewRow[]> {
  const { data, error } = await supabase
    .from("v_logistics_stock_alerts")
    .select("*")
    .order("warehouse_code", { ascending: true })
    .order("sku", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as LogisticsStockAlertViewRow[];
}
