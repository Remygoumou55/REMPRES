/**
 * Bloc 3 — Analytics Supply opérationnels (données live).
 */

import { format, startOfMonth } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { emitSupplyReportGenerated } from "@/lib/erp-core/events/integrations/supply-events";
import { getLogisticsOperationalOverview } from "@/modules/logistics/server/services/logistics-overview";
import { recordLogisticsGovernanceAudit } from "@/modules/logistics/server/services/logistics-audit-hook";
import { LOGISTICS_WRITE_ACTIONS } from "@/lib/logistics/runtime/logistics-write-governance";

export const SUPPLY_ANALYTICS_SOURCE = "supply-operational-analytics-bloc3-v1" as const;

export type SupplyOperationalAnalytics = {
  source: typeof SUPPLY_ANALYTICS_SOURCE;
  reportId: string;
  periodStart: string;
  overview: Awaited<ReturnType<typeof getLogisticsOperationalOverview>>;
  inventory: {
    skuPositions: number;
    totalQtyOnHand: number;
    estimatedValueGnf: number;
    lowStockAlerts: number;
  };
  movements: {
    volumeThisMonth: number;
  };
  procurement: {
    openPoBacklog: number;
    activeSuppliers: number;
  };
  generatedAt: string;
};

export async function buildSupplyOperationalAnalytics(
  supabase: SupabaseClient<Database>,
): Promise<SupplyOperationalAnalytics> {
  const periodStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthStartIso = `${periodStart}T00:00:00`;

  const overview = await getLogisticsOperationalOverview(supabase);

  const [balances, movements] = await Promise.all([
    supabase.from("logistics_inventory_balances").select("product_id,qty_on_hand"),
    supabase
      .from("logistics_stock_movements")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStartIso),
  ]);

  if (balances.error) throw new Error(balances.error.message);
  if (movements.error) throw new Error(movements.error.message);

  const balRows = balances.data ?? [];
  const totalQty = balRows.reduce((s, r) => s + Number(r.qty_on_hand), 0);

  const productIds = Array.from(new Set(balRows.map((r) => r.product_id)));
  let estimatedValueGnf = 0;
  if (productIds.length > 0) {
    const { data: prods, error: prodErr } = await supabase
      .from("products")
      .select("id,price_gnf")
      .in("id", productIds);
    if (prodErr) throw new Error(prodErr.message);
    const priceMap = new Map((prods ?? []).map((p) => [p.id, Number(p.price_gnf ?? 0)]));
    for (const row of balRows) {
      estimatedValueGnf += Number(row.qty_on_hand) * (priceMap.get(row.product_id) ?? 0);
    }
  }

  return {
    source: SUPPLY_ANALYTICS_SOURCE,
    reportId: `supply-analytics-${periodStart}`,
    periodStart,
    overview,
    inventory: {
      skuPositions: balances.data?.length ?? 0,
      totalQtyOnHand: totalQty,
      estimatedValueGnf: Math.round(estimatedValueGnf * 100) / 100,
      lowStockAlerts: overview.stockAlertRows,
    },
    movements: {
      volumeThisMonth: movements.count ?? 0,
    },
    procurement: {
      openPoBacklog: overview.openPurchaseOrders,
      activeSuppliers: overview.supplierCount,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function generateSupplyOperationalReport(
  userId: string,
): Promise<
  { success: true; analytics: SupplyOperationalAnalytics } | { success: false; error: string }
> {
  try {
    const supabase = getSupabaseServerClient();
    const analytics = await buildSupplyOperationalAnalytics(supabase);

    await Promise.all([
      emitSupplyReportGenerated({
        actorUserId: userId,
        reportId: analytics.reportId,
        reportType: "supply.operational.analytics",
      }),
      recordLogisticsGovernanceAudit({
        actionType: LOGISTICS_WRITE_ACTIONS.REPORT_GENERATE,
        entityType: "supply_report",
        entityId: analytics.reportId,
        afterSnapshot: {
          inventory_value_gnf: analytics.inventory.estimatedValueGnf,
          movement_volume: analytics.movements.volumeThisMonth,
        },
      }),
    ]);

    return { success: true, analytics };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur analytics supply.",
    };
  }
}
