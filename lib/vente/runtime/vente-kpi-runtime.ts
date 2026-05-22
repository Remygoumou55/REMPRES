/**
 * B2.0 — Façade runtime KPI Vente : 1 consommation officielle par domaine (commerce vs CRM).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getVenteCommerceKpis, VENTE_COMMERCE_KPI_SOURCE } from "@/lib/vente/runtime/vente-commerce-kpis";
import type { CrmOperationalOverview } from "@/modules/crm/server/services/crm-overview";
import { getCrmOperationalOverviewGuarded } from "@/modules/crm/server/services/crm-overview";

export const VENTE_RUNTIME_KPI_BUNDLE_SOURCE = "vente-runtime-kpi-bundle-v1" as const;

export type VenteRuntimeKpiBundle = {
  source: typeof VENTE_RUNTIME_KPI_BUNDLE_SOURCE;
  generatedAt: string;
  commerce: Awaited<ReturnType<typeof getVenteCommerceKpis>>;
  crm: CrmOperationalOverview;
};

/**
 * Bundle pour pages nécessitant commerce + CRM (hub CRM) — sources distinctes, métadonnées explicites.
 */
export async function getVenteRuntimeKpiBundle(
  supabase: SupabaseClient<Database>,
  userId: string,
  now = new Date(),
): Promise<VenteRuntimeKpiBundle> {
  const [commerce, crm] = await Promise.all([
    getVenteCommerceKpis(supabase, now),
    getCrmOperationalOverviewGuarded(supabase, userId),
  ]);

  return {
    source: VENTE_RUNTIME_KPI_BUNDLE_SOURCE,
    generatedAt: now.toISOString(),
    commerce,
    crm,
  };
}

const VENTE_ACTIVITY_MODULE_KEYS = ["clients", "produits", "vente", "sales", "products"] as const;

/**
 * Payload supervision `/api/dept/vente/kpis` — dérivé uniquement de getVenteCommerceKpis (XL-1).
 */
export async function buildDeptVenteKpiPayload(
  supabase: SupabaseClient<Database>,
  now = new Date(),
): Promise<DeptKpiPayload> {
  const commerce = await getVenteCommerceKpis(supabase, now);

  const recentActivityRows = await supabase
    .from("activity_logs")
    .select("id,module_key,action_key,created_at")
    .in("module_key", [...VENTE_ACTIVITY_MODULE_KEYS])
    .order("created_at", { ascending: false })
    .limit(5);

  const topProductsRows = await supabase
    .from("products")
    .select("id,name")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(5);

  const lowStockCount = commerce.productsLowStock > 0 ? commerce.productsLowStock : 0;

  return {
    stats: [
      { id: "clients", label: "dashboard.dept.kpi.clients", value: commerce.clientsTotal, unit: "count" },
      { id: "products", label: "dashboard.dept.kpi.products", value: commerce.productsTotal, unit: "count" },
      {
        id: "salesToday",
        label: "dashboard.dept.kpi.salesToday",
        value: commerce.salesTodayCount,
        unit: "count",
      },
      {
        id: "salesThisMonth",
        label: "dashboard.dept.kpi.salesThisMonth",
        value: commerce.netSaleAmountMonth,
        unit: "currency",
      },
    ],
    charts: [
      {
        id: "salesLast7Days",
        title: "dashboard.dept.chart.salesLast7Days",
        kind: "line",
        xKey: "x",
        series: [{ key: "total", label: "dashboard.dept.chart.totalSales" }],
        points: commerce.salesLast7Days.map((item) => ({
          x: item.date,
          total: item.amount,
        })),
      },
    ],
    alerts: lowStockCount
      ? [{ id: "lowStock", level: "warning", message: "dashboard.dept.alert.lowStock" }]
      : [],
    activity: (recentActivityRows.data ?? []).map((entry) => ({
      id: entry.id,
      label: entry.action_key,
      timestamp: entry.created_at,
    })),
    health: {
      status: "ok",
      notes: (topProductsRows.data ?? []).length ? [] : ["dashboard.dept.health.partialTopProducts"],
    },
    metadata: {
      source: VENTE_COMMERCE_KPI_SOURCE,
      generatedAt: commerce.generatedAt,
      placeholder: false,
    },
  };
}
