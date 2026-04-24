/**
 * Prévisions (GNF) — logique pure partagée. Basée sur l’historique journalier
 * (moyenne + tendance linéaire simple).
 */
import { addDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { FinanceDayPoint } from "@/lib/server/finance-overview";

export type FinanceProjectionDay = {
  date: string;
  label: string;
  revenue: number;
  expenses: number;
  isForecast: true;
};

export type FinanceProjectionSummary = {
  /** Jours de projection (après le dernier point historique) */
  nextDays: FinanceProjectionDay[];
  /** Somme revenus/dépenses/profit projetés sur l’horizon */
  totalProjectedRevenue: number;
  totalProjectedExpenses: number;
  totalProjectedProfit: number;
  /** Tendance (GNF / jour) sur revenus et dépenses, estimée OLS */
  trendRevenuePerDay: number;
  trendExpensesPerDay: number;
};

/**
 * Régression linéaire y ≈ a + b·x (x = 0..n-1).
 */
function olsLine(y: number[]): { a: number; b: number } {
  const n = y.length;
  if (n === 0) return { a: 0, b: 0 };
  if (n === 1) return { a: y[0], b: 0 };
  const xs = Array.from({ length: n }, (_, i) => i);
  const mx = (n - 1) / 2;
  const my = y.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (y[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const b = den > 0 ? num / den : 0;
  const a = my - b * mx;
  return { a, b };
}

export const DEFAULT_PROJECTION_HORIZON = 7;

/**
 * À partir de la série journalière (période filtrée), projette N jours calendaires
 * au-delà de `lastHistoricalDate` (généralement `to` de la plage).
 */
export function buildFinanceProjection(
  chartInRange: FinanceDayPoint[],
  lastHistoricalDate: string,
  horizonDays: number = DEFAULT_PROJECTION_HORIZON,
): FinanceProjectionSummary {
  const rev = chartInRange.map((d) => d.revenue);
  const exp = chartInRange.map((d) => d.expenses);
  const n = Math.max(1, chartInRange.length);
  const rLine = olsLine(rev);
  const eLine = olsLine(exp);

  const start = addDays(parseISO(lastHistoricalDate), 1);
  const nextDays: FinanceProjectionDay[] = [];
  let tr = 0;
  let te = 0;
  for (let k = 0; k < horizonDays; k++) {
    const d = addDays(start, k);
    const x = n + k;
    const revenue = Math.max(0, rLine.a + rLine.b * x);
    const expenses = Math.max(0, eLine.a + eLine.b * x);
    tr += revenue;
    te += expenses;
    nextDays.push({
      date: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE d MMM", { locale: fr }),
      revenue,
      expenses,
      isForecast: true,
    });
  }

  return {
    nextDays,
    totalProjectedRevenue: tr,
    totalProjectedExpenses: te,
    totalProjectedProfit: tr - te,
    trendRevenuePerDay: rLine.b,
    trendExpensesPerDay: eLine.b,
  };
}

export type RevExpChartRow = FinanceDayPoint & {
  revProj: number | null;
  expProj: number | null;
};

/**
 * Série unifiée : barres sur l’historique, lignes pointillées sur la projection.
 */
export function toRevenueExpenseChartRows(
  history: FinanceDayPoint[],
  forecast: FinanceProjectionDay[],
): RevExpChartRow[] {
  const rows: RevExpChartRow[] = history.map((p) => ({
    ...p,
    revProj: null,
    expProj: null,
  }));
  for (const f of forecast) {
    rows.push({
      date: f.date,
      label: f.label,
      revenue: 0,
      expenses: 0,
      revProj: f.revenue,
      expProj: f.expenses,
    });
  }
  return rows;
}
