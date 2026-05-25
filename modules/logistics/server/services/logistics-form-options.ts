import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { listLogisticsSuppliers } from "@/modules/logistics/server/repositories/logistics-suppliers-repository";
import { listLogisticsWarehouses } from "@/modules/logistics/server/repositories/logistics-warehouses-repository";

export type LogisticsFormOption = { id: string; label: string };

export async function getLogisticsFormOptions(
  supabase: SupabaseClient<Database>,
): Promise<{
  suppliers: LogisticsFormOption[];
  warehouses: LogisticsFormOption[];
  products: LogisticsFormOption[];
}> {
  const [suppliers, warehouses, productsRes] = await Promise.all([
    listLogisticsSuppliers(supabase, 80),
    listLogisticsWarehouses(supabase),
    supabase
      .from("products")
      .select("id,name,sku")
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(120),
  ]);

  if (productsRes.error) throw new Error(productsRes.error.message);

  return {
    suppliers: suppliers
      .filter((s) => s.is_active)
      .map((s) => ({ id: s.id, label: `${s.supplier_code} — ${s.company_name}` })),
    warehouses: warehouses.map((w) => ({ id: w.id, label: `${w.code} — ${w.label}` })),
    products: (productsRes.data ?? []).map((p) => ({
      id: p.id,
      label: `${p.sku ?? ""} ${p.name}`.trim(),
    })),
  };
}
