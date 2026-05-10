import type { Database } from "@/types/database.types";

export type LogisticsWarehouseRow = Database["public"]["Tables"]["logistics_warehouses"]["Row"];
export type LogisticsSupplierRow = Database["public"]["Tables"]["logistics_suppliers"]["Row"];
export type LogisticsPurchaseOrderRow = Database["public"]["Tables"]["logistics_purchase_orders"]["Row"];
export type LogisticsStockMovementRow = Database["public"]["Tables"]["logistics_stock_movements"]["Row"];
export type LogisticsDeliveryOrderRow = Database["public"]["Tables"]["logistics_delivery_orders"]["Row"];

/** Aligné sur `v_logistics_stock_alerts`. */
export type LogisticsStockAlertViewRow = {
  warehouse_id: string;
  warehouse_code: string;
  product_id: string;
  sku: string;
  product_name: string;
  qty_on_hand: number;
  stock_threshold: number;
};
