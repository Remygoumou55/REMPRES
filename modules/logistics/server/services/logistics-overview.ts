import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type LogisticsOperationalOverview = {
  warehouseCount: number;
  supplierCount: number;
  openPurchaseOrders: number;
  activeDeliveries: number;
  stockAlertRows: number;
};

export async function getLogisticsOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<LogisticsOperationalOverview> {
  const [wh, sup, po, del, alerts] = await Promise.all([
    supabase.from("logistics_warehouses").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("logistics_suppliers").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("logistics_purchase_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "submitted", "approved", "partially_received"]),
    supabase
      .from("logistics_delivery_orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["planned", "picking", "shipped"]),
    supabase.from("v_logistics_stock_alerts").select("product_id", { count: "exact", head: true }),
  ]);

  const errors = [wh.error, sup.error, po.error, del.error, alerts.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    warehouseCount: wh.count ?? 0,
    supplierCount: sup.count ?? 0,
    openPurchaseOrders: po.count ?? 0,
    activeDeliveries: del.count ?? 0,
    stockAlertRows: alerts.count ?? 0,
  };
}
