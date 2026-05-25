/**
 * Bloc 3 — KPI runtime département logistique (données live).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getLogisticsOperationalOverview } from "@/modules/logistics/server/services/logistics-overview";
import { buildSupplyOperationalAnalytics } from "@/modules/logistics/server/services/logistics-analytics-service";

export const LOGISTICS_RUNTIME_KPI_SOURCE = "logistics-runtime-kpi-bundle-v1" as const;

export async function buildDeptLogistiqueKpiPayload(
  supabase: SupabaseClient<Database>,
  _userId: string,
  now = new Date(),
): Promise<DeptKpiPayload> {
  const [overview, analytics] = await Promise.all([
    getLogisticsOperationalOverview(supabase),
    buildSupplyOperationalAnalytics(supabase),
  ]);

  const alerts =
    overview.stockAlertRows > 0
      ? [
          {
            id: "low_stock",
            level: "warning" as const,
            message: "dashboard.dept.alert.lowStock",
          },
        ]
      : overview.openPurchaseOrders > 0
        ? [
            {
              id: "po_backlog",
              level: "info" as const,
              message: "dashboard.dept.alert.poBacklog",
            },
          ]
        : [];

  return {
    stats: [
      {
        id: "totalItems",
        label: "dashboard.dept.kpi.totalItems",
        value: analytics.inventory.skuPositions,
        unit: "count",
      },
      {
        id: "lowStockItems",
        label: "dashboard.dept.kpi.lowStockItems",
        value: overview.stockAlertRows,
        unit: "count",
      },
      {
        id: "pendingOrders",
        label: "dashboard.dept.kpi.pendingOrders",
        value: overview.openPurchaseOrders,
        unit: "count",
      },
      {
        id: "inventoryValue",
        label: "dashboard.dept.kpi.inventoryValue",
        value: analytics.inventory.estimatedValueGnf,
        unit: "currency",
      },
    ],
    charts: [],
    alerts,
    activity: [],
    health: { status: "ok" },
    metadata: {
      source: LOGISTICS_RUNTIME_KPI_SOURCE,
      generatedAt: now.toISOString(),
      placeholder: false,
    },
  };
}
