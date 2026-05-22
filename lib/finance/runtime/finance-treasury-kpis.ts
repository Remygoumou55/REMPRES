/**
 * B3 — SoT KPI trésorerie / CFO (financial_transactions via getFinanceCfoData).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getFinanceCfoData, type FinanceDayPoint } from "@/lib/server/finance-overview";
import type { DayStats } from "@/lib/vente/runtime/sale-kpi-aggregates";

export const FINANCE_TREASURY_KPI_SOURCE = "finance-treasury-runtime-v1" as const;

export type FinanceTreasuryKpis = {
  source: typeof FINANCE_TREASURY_KPI_SOURCE;
  generatedAt: string;
  netRevenueToday: number;
  netRevenueMonth: number;
  grossRevenueMonth: number;
  cancelledRevenueMonth: number;
  expensesMonth: number;
  profitMonth: number;
  marginPctMonth: number | null;
  expensesToday: number;
  profitToday: number;
  treasuryLast7Days: DayStats[];
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function firstDayOfMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function mapFinanceDaysToNetDayStats(days: FinanceDayPoint[]): DayStats[] {
  return days.map((d) => ({
    date: d.date,
    label: d.label,
    amount: Math.round((d.revenue - d.expenses) * 100) / 100,
    count: d.revenue > 0 || d.expenses > 0 ? 1 : 0,
  }));
}

/**
 * Agrégats trésorerie — source unique financial_transactions (règles net vente / dépenses actives).
 */
export async function getFinanceTreasuryKpis(
  supabase: SupabaseClient<Database>,
  now = new Date(),
): Promise<FinanceTreasuryKpis> {
  const to = isoDate(now);
  const monthFrom = firstDayOfMonth(now);
  const filters = { categoryIds: [] as string[], createdByUserId: null as string | null };

  const [monthData, todayData] = await Promise.all([
    getFinanceCfoData(supabase, { from: monthFrom, to, ...filters }),
    getFinanceCfoData(supabase, { from: to, to, ...filters }),
  ]);

  return {
    source: FINANCE_TREASURY_KPI_SOURCE,
    generatedAt: now.toISOString(),
    netRevenueToday: todayData.netSaleRevenue,
    netRevenueMonth: monthData.netSaleRevenue,
    grossRevenueMonth: monthData.grossSaleRevenue,
    cancelledRevenueMonth: monthData.cancelledSaleRevenue,
    expensesMonth: monthData.totalExpenses,
    profitMonth: monthData.profit,
    marginPctMonth: monthData.marginPct,
    expensesToday: todayData.totalExpenses,
    profitToday: todayData.netSaleRevenue - todayData.totalExpenses,
    treasuryLast7Days: mapFinanceDaysToNetDayStats(monthData.chartLast7d),
  };
}
