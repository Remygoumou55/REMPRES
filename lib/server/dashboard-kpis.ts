import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getActivityLogsMonitoring } from "@/lib/server/activity-logs";
import {
  formatProfileDisplayName,
  displayNameFromEmail,
} from "@/lib/server/profile-display";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DayStats = {
  date:   string;   // ISO date "2026-04-15"
  label:  string;   // "Lun", "Mar", …
  amount: number;   // total GNF
  count:  number;   // nombre de ventes
};

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
// Helpers
// ---------------------------------------------------------------------------

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

type SaleKpiRow = {
  total_amount_gnf: number | null;
  payment_status: string | null;
  created_at: string;
};

function summarizeSaleAmounts(rows: SaleKpiRow[] | null) {
  const list = rows ?? [];
  let gross = 0;
  let cancelled = 0;
  for (const r of list) {
    const amt = Number(r.total_amount_gnf ?? 0);
    gross += amt;
    if (r.payment_status === "cancelled") {
      cancelled += amt;
    }
  }
  return {
    count: list.length,
    grossSaleAmount: gross,
    cancelledSaleAmount: cancelled,
    netSaleAmount: gross - cancelled,
  };
}

function buildLast7Days(): { iso: string; label: string }[] {
  const result: { iso: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    result.push({ iso, label: DAY_LABELS[d.getDay()] });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = getSupabaseServerClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    clientsRes,
    todaySalesRes,
    monthlySalesRes,
    weekSalesRes,
    allProductsRes,
    recentLogsRes,
    monitoring,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("sales")
      .select("total_amount_gnf,payment_status,created_at")
      .is("deleted_at", null)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("sales")
      .select("total_amount_gnf,payment_status,created_at")
      .is("deleted_at", null)
      .gte("created_at", monthStart.toISOString()),
    supabase
      .from("sales")
      .select("created_at, total_amount_gnf, payment_status")
      .is("deleted_at", null)
      .gte("created_at", sevenDaysAgo.toISOString()),
    supabase
      .from("products")
      .select("stock_quantity, stock_threshold")
      .is("deleted_at", null),
    supabase
      .from("activity_logs")
      .select("id, action_key, module_key, created_at, actor_user_id")
      .order("created_at", { ascending: false })
      .limit(6),
    getActivityLogsMonitoring({ moduleKey: "clients" }),
  ]);

  const clientsTotal = clientsRes.count ?? 0;
  const todayAgg = summarizeSaleAmounts(todaySalesRes.data as SaleKpiRow[] | null);
  const salesToday = todayAgg.count;
  const grossSaleAmountToday = todayAgg.grossSaleAmount;
  const cancelledSaleAmountToday = todayAgg.cancelledSaleAmount;
  const netSaleAmountToday = todayAgg.netSaleAmount;
  const salesAmountToday = netSaleAmountToday;

  const monthAgg = summarizeSaleAmounts(monthlySalesRes.data as SaleKpiRow[] | null);
  const salesCountMonth = monthAgg.count;
  const grossSaleAmountMonth = monthAgg.grossSaleAmount;
  const cancelledSaleAmountMonth = monthAgg.cancelledSaleAmount;
  const netSaleAmountMonth = monthAgg.netSaleAmount;
  const salesAmountMonth = netSaleAmountMonth;

  const weekSales = weekSalesRes.data as SaleKpiRow[] | null;
  const days = buildLast7Days();
  const salesLast7Days: DayStats[] = days.map(({ iso, label }) => {
    const dayRows = (weekSales ?? []).filter((r) => r.created_at.slice(0, 10) === iso);
    const dayNet = summarizeSaleAmounts(dayRows).netSaleAmount;
    return {
      date:   iso,
      label,
      amount: dayNet,
      count:  dayRows.length,
    };
  });

  const allProducts = allProductsRes.data;
  let productsLowStock   = 0;
  let productsOutOfStock = 0;
  for (const p of allProducts ?? []) {
    const qty       = p.stock_quantity  ?? 0;
    const threshold = p.stock_threshold ?? 5;
    if (qty === 0)            productsOutOfStock++;
    else if (qty <= threshold) productsLowStock++;
  }

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
    clientsTotal:          clientsTotal          ?? 0,
    deletesClientsLast24h: monitoring.deleteCountLast24h,
    salesToday,
    salesAmountToday,
    salesAmountMonth,
    salesCountMonth,
    grossSaleAmountToday,
    grossSaleAmountMonth,
    cancelledSaleAmountToday,
    cancelledSaleAmountMonth,
    netSaleAmountToday,
    netSaleAmountMonth,
    productsLowStock,
    productsOutOfStock,
    salesLast7Days,
    recentActivity,
  };
}
