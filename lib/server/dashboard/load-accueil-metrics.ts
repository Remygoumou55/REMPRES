import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { currentMonthRange, safeCount, safeSum } from "@/lib/utils/safe-query";
import { getVenteCommerceKpis } from "@/lib/vente/runtime/vente-commerce-kpis";
import { getFinanceTreasuryKpis } from "@/lib/finance/runtime/finance-treasury-kpis";
import { SALES_OPERATIONAL_LIFECYCLE } from "@/lib/vente/runtime/sales-lifecycle";
import { getRecentActivity } from "@/lib/server/get-recent-activity";
import { getUserDisplayWithClient, type UserDisplay } from "@/lib/server/get-user-display";
import type { ActivityItem } from "@/components/dashboard/activity-feed";
import type { DayStats } from "@/lib/vente/runtime/sale-kpi-aggregates";

export type AccueilMetrics = {
  revenueMonth: number;
  salesCountMonth: number;
  expensesMonth: number;
  profitMonth: number;
  activeEmployees: number;
  formationActive: number | null;
  marketingActive: number | null;
  stockCritical: number;
  pendingApprovals: number;
  salesLast7Days: DayStats[];
  formationEmpty: boolean;
  marketingEmpty: boolean;
  logistiqueEmpty: boolean;
};

export type AccueilDashboardBundle = {
  userDisplay: UserDisplay;
  metrics: AccueilMetrics;
  activities: ActivityItem[];
};

async function safeCountOptionalTable(
  supabase: SupabaseClient<Database>,
  table: string,
  status?: string,
): Promise<{ count: number; missing: boolean }> {
  try {
    const client = supabase as unknown as SupabaseClient;
    let query = client.from(table).select("id", { count: "exact", head: true });
    if (status) query = query.eq("status", status);
    const { count, error } = await query;
    if (error) return { count: 0, missing: true };
    return { count: count ?? 0, missing: false };
  } catch {
    return { count: 0, missing: true };
  }
}

async function loadAccueilMetricsUncached(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail?: string,
): Promise<AccueilDashboardBundle> {
  const { from, to } = currentMonthRange();

  const [
    userDisplay,
    revenueMonth,
    salesCountMonth,
    expensesMonth,
    activeEmployees,
    pendingApprovals,
    commerce,
    treasury,
    activities,
    formationResult,
    marketingResult,
  ] = await Promise.all([
    getUserDisplayWithClient(supabase, userId, userEmail),
    safeSum(
      supabase
        .from("sales")
        .select("total_amount_gnf")
        .gte("created_at", from)
        .lte("created_at", to)
        .is("deleted_at", null)
        .eq("lifecycle_status", SALES_OPERATIONAL_LIFECYCLE),
      "total_amount_gnf",
    ),
    safeCount(
      supabase
        .from("sales")
        .select("id", { count: "exact", head: true })
        .gte("created_at", from)
        .lte("created_at", to)
        .is("deleted_at", null)
        .eq("lifecycle_status", SALES_OPERATIONAL_LIFECYCLE),
    ),
    safeSum(
      supabase.from("expenses").select("amount_gnf").gte("created_at", from).lte("created_at", to),
      "amount_gnf",
    ),
    safeCount(
      supabase
        .from("rh_employee_contracts")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ),
    safeCount(
      supabase
        .from("approval_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    getVenteCommerceKpis(supabase),
    getFinanceTreasuryKpis(supabase),
    getRecentActivity(supabase, {
      excludeModules: ["audit"],
      excludeActions: ["read"],
      limit: 6,
    }),
    safeCountOptionalTable(supabase, "training_sessions", "active"),
    safeCountOptionalTable(supabase, "marketing_campaigns", "active"),
  ]);

  const expensesResolved = expensesMonth > 0 ? expensesMonth : treasury.expensesMonth;
  const revenueResolved = revenueMonth > 0 ? revenueMonth : treasury.netRevenueMonth;
  const profitMonth = revenueResolved - expensesResolved;
  const stockCritical = commerce.productsLowStock + commerce.productsOutOfStock;

  const formationEmpty = formationResult.missing;
  const marketingEmpty = marketingResult.missing;
  const logistiqueEmpty = false;

  return {
    userDisplay,
    metrics: {
      revenueMonth: revenueResolved,
      salesCountMonth: salesCountMonth > 0 ? salesCountMonth : commerce.salesCountMonth,
      expensesMonth: expensesResolved,
      profitMonth,
      activeEmployees,
      formationActive: formationEmpty ? null : formationResult.count,
      marketingActive: marketingEmpty ? null : marketingResult.count,
      stockCritical,
      pendingApprovals,
      salesLast7Days: commerce.salesLast7Days,
      formationEmpty,
      marketingEmpty,
      logistiqueEmpty,
    },
    activities,
  };
}

export const loadAccueilDashboard = cache(async (userId: string, userEmail?: string) => {
  const supabase = getSupabaseServerClient();
  return loadAccueilMetricsUncached(supabase, userId, userEmail);
});
