import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Stock multi-sites enterprise — table `logistics_inventory_balances` (products × entrepôt).
 * Pour les articles supply autonomes, utiliser `stock_items` via `lib/server/logistique.ts`.
 * Audit : docs/DUPLICATE_TABLES_AUDIT.md § Paire 2 — pas de fusion avec stock_items.
 */

export type LogisticsStockRow = Database["public"]["Tables"]["logistics_inventory_balances"]["Row"] & {
  products: Pick<
    Database["public"]["Tables"]["products"]["Row"],
    "sku" | "name" | "stock_threshold"
  > | null;
};

export async function listLogisticsStockWithProducts(
  supabase: SupabaseClient<Database>,
  limit = 200,
): Promise<LogisticsStockRow[]> {
  const { data, error } = await supabase
    .from("logistics_inventory_balances")
    .select("warehouse_id,product_id,qty_on_hand,updated_at,products(sku,name,stock_threshold)")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as LogisticsStockRow[];
}
