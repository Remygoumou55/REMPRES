/**
 * B2.0 — Source unique KPI Commerce Vente (B1.4 SoT, B1.3 cockpit, supervision dept).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { SALES_OPERATIONAL_LIFECYCLE } from "@/lib/vente/runtime/sales-lifecycle";
import {
  buildSalesLast7DaysNet,
  summarizeSaleAmounts,
  type DayStats,
  type SaleKpiRow,
} from "@/lib/vente/runtime/sale-kpi-aggregates";

export const VENTE_COMMERCE_KPI_SOURCE = "vente-commerce-runtime-v1" as const;

export type VenteCommerceKpis = {
  source: typeof VENTE_COMMERCE_KPI_SOURCE;
  generatedAt: string;
  clientsTotal: number;
  productsTotal: number;
  salesTodayCount: number;
  netSaleAmountToday: number;
  grossSaleAmountToday: number;
  cancelledSaleAmountToday: number;
  salesCountMonth: number;
  netSaleAmountMonth: number;
  grossSaleAmountMonth: number;
  cancelledSaleAmountMonth: number;
  productsLowStock: number;
  productsOutOfStock: number;
  salesLast7Days: DayStats[];
};

type PeriodBounds = {
  todayStart: string;
  monthStart: string;
  sevenDaysAgo: string;
};

function periodBounds(now = new Date()): PeriodBounds {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return {
    todayStart: todayStart.toISOString(),
    monthStart: monthStart.toISOString(),
    sevenDaysAgo: sevenDaysAgo.toISOString(),
  };
}

function operationalSalesSelect(supabase: SupabaseClient<Database>) {
  return supabase
    .from("sales")
    .select("total_amount_gnf,payment_status,created_at,lifecycle_status")
    .eq("lifecycle_status", SALES_OPERATIONAL_LIFECYCLE);
}

/**
 * Agrégats commerce — filtre officiel : lifecycle_status = validated (pas deleted_at).
 */
export async function getVenteCommerceKpis(
  supabase: SupabaseClient<Database>,
  now = new Date(),
): Promise<VenteCommerceKpis> {
  const bounds = periodBounds(now);

  const [
    clientsRes,
    productsRes,
    todaySalesRes,
    monthlySalesRes,
    weekSalesRes,
    allProductsRes,
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null),
    operationalSalesSelect(supabase).gte("created_at", bounds.todayStart),
    operationalSalesSelect(supabase).gte("created_at", bounds.monthStart),
    operationalSalesSelect(supabase)
      .gte("created_at", bounds.sevenDaysAgo)
      .order("created_at", { ascending: true }),
    supabase.from("products").select("stock_quantity, stock_threshold").is("deleted_at", null),
  ]);

  const todayAgg = summarizeSaleAmounts(todaySalesRes.data as SaleKpiRow[] | null);
  const monthAgg = summarizeSaleAmounts(monthlySalesRes.data as SaleKpiRow[] | null);

  let productsLowStock = 0;
  let productsOutOfStock = 0;
  for (const p of allProductsRes.data ?? []) {
    const qty = p.stock_quantity ?? 0;
    const threshold = p.stock_threshold ?? 5;
    if (qty === 0) productsOutOfStock++;
    else if (qty <= threshold) productsLowStock++;
  }

  return {
    source: VENTE_COMMERCE_KPI_SOURCE,
    generatedAt: now.toISOString(),
    clientsTotal: clientsRes.count ?? 0,
    productsTotal: productsRes.count ?? 0,
    salesTodayCount: todayAgg.count,
    netSaleAmountToday: todayAgg.netSaleAmount,
    grossSaleAmountToday: todayAgg.grossSaleAmount,
    cancelledSaleAmountToday: todayAgg.cancelledSaleAmount,
    salesCountMonth: monthAgg.count,
    netSaleAmountMonth: monthAgg.netSaleAmount,
    grossSaleAmountMonth: monthAgg.grossSaleAmount,
    cancelledSaleAmountMonth: monthAgg.cancelledSaleAmount,
    productsLowStock,
    productsOutOfStock,
    salesLast7Days: buildSalesLast7DaysNet(weekSalesRes.data as SaleKpiRow[] | null),
  };
}
