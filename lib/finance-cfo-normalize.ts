/**
 * Normalisation CFO côté client — évite les crash si le payload est incomplet
 * (RSC / JSON / merge partiel).
 */
import type { FinanceCfoData, PeriodDelta } from "@/lib/server/finance-overview";

const DEFAULT_DELTA: PeriodDelta = {
  revenuePct: null,
  expensesPct: null,
  profitPct: null,
};

function finite(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function deltaPct(v: unknown): number | null {
  if (v === null) return null;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function normalizeFinanceCfoData(raw: FinanceCfoData | Record<string, unknown> | null | undefined): FinanceCfoData {
  const d = (raw ?? {}) as Partial<FinanceCfoData>;
  const deltaRaw = d.delta;
  const prevRaw = d.previous;

  return {
    totalRevenue: finite(d.totalRevenue, 0),
    totalExpenses: finite(d.totalExpenses, 0),
    profit: finite(d.profit, 0),
    marginPct:
      d.marginPct === null || d.marginPct === undefined
        ? null
        : typeof d.marginPct === "number" && Number.isFinite(d.marginPct)
          ? d.marginPct
          : null,
    avgDailyRevenue: finite(d.avgDailyRevenue, 0),
    avgDailyExpenses: finite(d.avgDailyExpenses, 0),
    dayCount: finite(d.dayCount, 1),
    chartInRange: Array.isArray(d.chartInRange) ? d.chartInRange : [],
    chartLast7d: Array.isArray(d.chartLast7d) ? d.chartLast7d : [],
    cashflowInRange: Array.isArray(d.cashflowInRange) ? d.cashflowInRange : [],
    expensesByCategory: Array.isArray(d.expensesByCategory) ? d.expensesByCategory : [],
    previous:
      prevRaw && typeof prevRaw === "object"
        ? {
            totalRevenue: finite(prevRaw.totalRevenue, 0),
            totalExpenses: finite(prevRaw.totalExpenses, 0),
            profit: finite(prevRaw.profit, 0),
          }
        : { totalRevenue: 0, totalExpenses: 0, profit: 0 },
    delta:
      deltaRaw && typeof deltaRaw === "object"
        ? {
            revenuePct: deltaPct(deltaRaw.revenuePct),
            expensesPct: deltaPct(deltaRaw.expensesPct),
            profitPct: deltaPct(deltaRaw.profitPct),
          }
        : DEFAULT_DELTA,
  };
}
