import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getActivityLogsMonitoring } from "@/lib/server/activity-logs";
import {
  formatProfileDisplayName,
  displayNameFromEmail,
} from "@/lib/server/profile-display";
import { getVenteCommerceKpis } from "@/lib/vente/runtime/vente-commerce-kpis";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type { DayStats } from "@/lib/vente/runtime/sale-kpi-aggregates";
import type { DayStats } from "@/lib/vente/runtime/sale-kpi-aggregates";

export type RecentActivityEntry = {
  id:         string;
  action_key: string;       // "create" | "update" | "delete"
  module_key: string;
  /** Libellé issu de `profiles.first_name` / `last_name` uniquement */
  actor_display_name: string | null;
  created_at: string;
};

export type DashboardKpis = {
  clientsTotal:          number;
  deletesClientsLast24h: number;
  salesToday:            number;
  salesAmountToday:      number;
  salesAmountMonth:      number;
  salesCountMonth:       number;
  /** Σ montants ventes sur la période (inclut les montants annulés pour lecture brute KPI). */
  grossSaleAmountToday:  number;
  grossSaleAmountMonth:  number;
  cancelledSaleAmountToday:  number;
  cancelledSaleAmountMonth:  number;
  /** CA net ventes = brut − annulations (cohérent avec les agrégations finance). */
  netSaleAmountToday:    number;
  netSaleAmountMonth:    number;
  productsLowStock:      number;
  productsOutOfStock:    number;
  salesLast7Days:        DayStats[];
  recentActivity:        RecentActivityEntry[];
};

// ---------------------------------------------------------------------------
// Main function — commerce KPI via B2.0 getVenteCommerceKpis (lifecycle validated).
// ---------------------------------------------------------------------------

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = getSupabaseServerClient();

  const [commerce, recentLogsRes, monitoring] = await Promise.all([
    getVenteCommerceKpis(supabase),
    supabase
      .from("activity_logs")
      .select("id, action_key, module_key, created_at, actor_user_id")
      .order("created_at", { ascending: false })
      .limit(6),
    getActivityLogsMonitoring({ moduleKey: "clients" }),
  ]);

  const recentLogs = recentLogsRes.data;

  const actorIdSet = new Set<string>();
  (recentLogs ?? []).forEach((l) => { if (l.actor_user_id) actorIdSet.add(l.actor_user_id); });
  const actorIds = Array.from(actorIdSet);
  const actorNames: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      const label =
        formatProfileDisplayName(p.first_name, p.last_name).trim() ||
        displayNameFromEmail(p.email) ||
        p.id.slice(0, 8);
      actorNames[p.id] = label;
    }
  }

  const recentActivity: RecentActivityEntry[] = (recentLogs ?? []).map((l) => ({
    id:         l.id,
    action_key: l.action_key,
    module_key: l.module_key,
    actor_display_name: l.actor_user_id ? (actorNames[l.actor_user_id] ?? null) : null,
    created_at: l.created_at,
  }));

  return {
    clientsTotal: commerce.clientsTotal,
    deletesClientsLast24h: monitoring.deleteCountLast24h,
    salesToday: commerce.salesTodayCount,
    salesAmountToday: commerce.netSaleAmountToday,
    salesAmountMonth: commerce.netSaleAmountMonth,
    salesCountMonth: commerce.salesCountMonth,
    grossSaleAmountToday: commerce.grossSaleAmountToday,
    grossSaleAmountMonth: commerce.grossSaleAmountMonth,
    cancelledSaleAmountToday: commerce.cancelledSaleAmountToday,
    cancelledSaleAmountMonth: commerce.cancelledSaleAmountMonth,
    netSaleAmountToday: commerce.netSaleAmountToday,
    netSaleAmountMonth: commerce.netSaleAmountMonth,
    productsLowStock: commerce.productsLowStock,
    productsOutOfStock: commerce.productsOutOfStock,
    salesLast7Days: commerce.salesLast7Days,
    recentActivity,
  };
}
