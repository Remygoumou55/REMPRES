import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getActivityLogsMonitoring } from "@/lib/server/activity-logs";
import {
  formatProfileDisplayName,
  profileDisplayNameOrFallback,
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
  productsLowStock:      number;
  productsOutOfStock:    number;
  salesLast7Days:        DayStats[];
  recentActivity:        RecentActivityEntry[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

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

  // ── Clients ──────────────────────────────────────────────────────────────
  const { count: clientsTotal } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  // ── Ventes aujourd'hui ───────────────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todaySales } = await supabase
    .from("sales")
    .select("total_amount_gnf")
    .is("deleted_at", null)
    .gte("created_at", todayStart.toISOString())
    .neq("payment_status", "cancelled");

  const salesToday       = todaySales?.length ?? 0;
  const salesAmountToday = (todaySales ?? []).reduce((s, r) => s + (r.total_amount_gnf ?? 0), 0);

  // ── Ventes ce mois ───────────────────────────────────────────────────────
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthlySales } = await supabase
    .from("sales")
    .select("total_amount_gnf")
    .is("deleted_at", null)
    .gte("created_at", monthStart.toISOString())
    .neq("payment_status", "cancelled");

  const salesAmountMonth = (monthlySales ?? []).reduce((s, r) => s + (r.total_amount_gnf ?? 0), 0);
  const salesCountMonth  = monthlySales?.length ?? 0;

  // ── Ventes 7 derniers jours ───────────────────────────────────────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: weekSales } = await supabase
    .from("sales")
    .select("created_at, total_amount_gnf")
    .is("deleted_at", null)
    .gte("created_at", sevenDaysAgo.toISOString())
    .neq("payment_status", "cancelled");

  const days = buildLast7Days();
  const salesLast7Days: DayStats[] = days.map(({ iso, label }) => {
    const dayRows = (weekSales ?? []).filter(
      (r) => r.created_at.slice(0, 10) === iso,
    );
    return {
      date:   iso,
      label,
      amount: dayRows.reduce((s, r) => s + (r.total_amount_gnf ?? 0), 0),
      count:  dayRows.length,
    };
  });

  // ── Produits stock ────────────────────────────────────────────────────────
  const { data: allProducts } = await supabase
    .from("products")
    .select("stock_quantity, stock_threshold")
    .is("deleted_at", null);

  let productsLowStock   = 0;
  let productsOutOfStock = 0;
  for (const p of allProducts ?? []) {
    const qty       = p.stock_quantity  ?? 0;
    const threshold = p.stock_threshold ?? 5;
    if (qty === 0)            productsOutOfStock++;
    else if (qty <= threshold) productsLowStock++;
  }

  // ── Activité récente ──────────────────────────────────────────────────────
  const { data: recentLogs } = await supabase
    .from("activity_logs")
    .select("id, action_key, module_key, created_at, actor_user_id")
    .order("created_at", { ascending: false })
    .limit(6);

  // Résoudre les emails des acteurs
  const actorIdSet = new Set<string>();
  (recentLogs ?? []).forEach((l) => { if (l.actor_user_id) actorIdSet.add(l.actor_user_id); });
  const actorIds = Array.from(actorIdSet);
  const actorNames: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", actorIds);
    for (const p of profiles ?? []) {
      const label = formatProfileDisplayName(p.first_name, p.last_name).trim();
      actorNames[p.id] = label || profileDisplayNameOrFallback(null, null);
    }
  }

  const recentActivity: RecentActivityEntry[] = (recentLogs ?? []).map((l) => ({
    id:         l.id,
    action_key: l.action_key,
    module_key: l.module_key,
    actor_display_name: l.actor_user_id ? (actorNames[l.actor_user_id] ?? null) : null,
    created_at: l.created_at,
  }));

  // ── Audit monitoring ──────────────────────────────────────────────────────
  const monitoring = await getActivityLogsMonitoring({ moduleKey: "clients" });

  return {
    clientsTotal:          clientsTotal          ?? 0,
    deletesClientsLast24h: monitoring.deleteCountLast24h,
    salesToday,
    salesAmountToday,
    salesAmountMonth,
    salesCountMonth,
    productsLowStock,
    productsOutOfStock,
    salesLast7Days,
    recentActivity,
  };
}
