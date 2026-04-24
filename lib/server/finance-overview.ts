/**
 * Module Finance — agrégations à partir de `financial_transactions` (lecture seule).
 * Filtres optionnels : catégories (dépenses), auteur (super admin).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Database } from "@/types/database.types";
import { listExpenseCategories, type ExpenseCategoryRow } from "@/lib/server/expenses";

type FTRow = Database["public"]["Tables"]["financial_transactions"]["Row"];

const PAGE = 1000;

export type FinanceDayPoint = {
  date: string;
  label: string;
  revenue: number;
  expenses: number;
};

export type FinanceCashflowPoint = FinanceDayPoint & {
  cashIn: number;
  cashOut: number;
  net: number;
  cumulative: number;
};

export type FinanceCategorySlice = {
  categoryId: string;
  name: string;
  color: string;
  amount: number;
};

export type FinanceQueryFilters = {
  from: string;
  to: string;
  /** Filtre catégories de dépense (IDs). Vide = toutes. N’affecte pas le CA (ventes). */
  categoryIds: string[];
  /** Filtre créateur sur la FT (tous types). Réservé super admin côté app. */
  createdByUserId: string | null;
};

export type PeriodDelta = {
  revenuePct: number | null;
  expensesPct: number | null;
  profitPct: number | null;
};

export type FinanceCfoData = {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  marginPct: number | null;
  avgDailyRevenue: number;
  avgDailyExpenses: number;
  dayCount: number;
  chartInRange: FinanceDayPoint[];
  chartLast7d: FinanceDayPoint[];
  cashflowInRange: FinanceCashflowPoint[];
  expensesByCategory: FinanceCategorySlice[];
  previous: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
  };
  delta: PeriodDelta;
};

/** @deprecated Utiliser `FinanceCfoData` + `getFinanceCfoData` */
export type FinanceOverview = Pick<
  FinanceCfoData,
  "totalRevenue" | "totalExpenses" | "profit" | "chartInRange" | "chartLast7d" | "expensesByCategory"
>;

function rangeStartIso(d: string): string {
  return `${d}T00:00:00.000Z`;
}

function rangeEndIso(d: string): string {
  return `${d}T23:59:59.999Z`;
}

function isActiveFt(r: FTRow): boolean {
  return r.status !== "cancelled" && (r.source_type === "sale" || r.source_type === "expense");
}

function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

async function loadFtInWindow(
  supabase: SupabaseClient<Database>,
  from: string,
  to: string,
  createdByUserId: string | null,
): Promise<FTRow[]> {
  const all: FTRow[] = [];
  let start = 0;
  for (;;) {
    let q = supabase
      .from("financial_transactions")
      .select("id, source_type, source_id, amount_gnf, status, created_at, created_by")
      .in("source_type", ["sale", "expense"])
      .not("status", "eq", "cancelled")
      .gte("created_at", rangeStartIso(from))
      .lte("created_at", rangeEndIso(to))
      .order("created_at", { ascending: true });

    if (createdByUserId) {
      q = q.eq("created_by", createdByUserId);
    }

    const { data, error } = await q.range(start, start + PAGE - 1);

    if (error) {
      throw new Error(`Transactions financières : ${error.message}`);
    }
    const batch = (data ?? []) as FTRow[];
    all.push(...batch);
    if (batch.length < PAGE) break;
    start += PAGE;
  }
  return all;
}

/** Map expense source_id -> category_id (requête groupée, RLS). */
async function mapExpenseSourceToCategory(
  supabase: SupabaseClient<Database>,
  sourceIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (sourceIds.length === 0) return map;
  const chunk = 200;
  for (let i = 0; i < sourceIds.length; i += chunk) {
    const slice = sourceIds.slice(i, i + chunk);
    const { data, error } = await supabase
      .from("expenses")
      .select("id, category_id")
      .in("id", slice)
      .is("deleted_at", null);
    if (error) {
      throw new Error(`Catégories dépenses : ${error.message}`);
    }
    for (const e of data ?? []) {
      map.set(e.id, e.category_id);
    }
  }
  return map;
}

/**
 * Filtre les lignes FT : le filtre catégorie ne s'applique qu'aux dépenses.
 * Les ventes restent intégrales.
 */
function applyCategoryFilter(
  rows: FTRow[],
  categoryIds: string[],
  expenseIdToCategory: Map<string, string>,
): FTRow[] {
  if (categoryIds.length === 0) return rows;
  const set = new Set(categoryIds);
  return rows.filter((r) => {
    if (r.source_type === "sale") return true;
    if (r.source_type === "expense") {
      const cat = expenseIdToCategory.get(r.source_id);
      return cat != null && set.has(cat);
    }
    return false;
  });
}

function sumByType(rows: FTRow[], type: "sale" | "expense"): number {
  return rows
    .filter((r) => isActiveFt(r) && r.source_type === type)
    .reduce((s, r) => s + Number(r.amount_gnf), 0);
}

function bucketByDay(
  rows: FTRow[],
  days: { date: string; label: string }[],
): FinanceDayPoint[] {
  const byDate = new Map<string, { revenue: number; expenses: number }>();
  for (const d of days) {
    byDate.set(d.date, { revenue: 0, expenses: 0 });
  }
  for (const r of rows) {
    if (!isActiveFt(r)) continue;
    const d = r.created_at.slice(0, 10);
    const cur = byDate.get(d);
    if (!cur) continue;
    const a = Number(r.amount_gnf);
    if (r.source_type === "sale") cur.revenue += a;
    else if (r.source_type === "expense") cur.expenses += a;
  }
  return days.map(({ date, label }) => {
    const c = byDate.get(date) ?? { revenue: 0, expenses: 0 };
    return { date, label, revenue: c.revenue, expenses: c.expenses };
  });
}

function buildCashflow(points: FinanceDayPoint[]): FinanceCashflowPoint[] {
  let cum = 0;
  return points.map((d) => {
    const net = d.revenue - d.expenses;
    cum += net;
    return {
      ...d,
      cashIn: d.revenue,
      cashOut: d.expenses,
      net,
      cumulative: cum,
    };
  });
}

function buildDayLabels(from: string, to: string): { date: string; label: string }[] {
  const start = parseISO(from);
  const end = parseISO(to);
  if (isBefore(end, start)) return [];
  const interval = eachDayOfInterval({ start, end });
  return interval.map((d) => ({
    date: format(d, "yyyy-MM-dd"),
    label: format(d, "EEE d MMM", { locale: fr }),
  }));
}

function last7dDays(to: string): { date: string; label: string }[] {
  const end = startOfDay(parseISO(to));
  const start = addDays(end, -6);
  return eachDayOfInterval({ start, end }).map((d) => ({
    date: format(d, "yyyy-MM-dd"),
    label: format(d, "EEE d", { locale: fr }),
  }));
}

function previousPeriodRange(from: string, to: string): { prevFrom: string; prevTo: string } {
  const a = parseISO(from);
  const b = parseISO(to);
  const n = differenceInCalendarDays(b, a) + 1;
  const prevEnd = addDays(a, -1);
  const prevStart = addDays(prevEnd, -(n - 1));
  return {
    prevFrom: format(prevStart, "yyyy-MM-dd"),
    prevTo: format(prevEnd, "yyyy-MM-dd"),
  };
}

async function buildExpenseCategorySlices(
  supabase: SupabaseClient<Database>,
  expenseFtRows: FTRow[],
  categoryRows: ExpenseCategoryRow[],
): Promise<FinanceCategorySlice[]> {
  const rows = expenseFtRows.filter((r) => r.source_type === "expense" && r.status !== "cancelled");
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((r) => r.source_id);
  const { data: expRows, error: e2 } = await supabase
    .from("expenses")
    .select("id, category_id")
    .in("id", ids)
    .is("deleted_at", null);

  if (e2) {
    throw new Error(`Dépenses (join) : ${e2.message}`);
  }

  const idToCat = new Map((expRows ?? []).map((e) => [e.id, e.category_id] as const));
  const catMap = new Map(categoryRows.map((c) => [c.id, c] as const));

  const byCat = new Map<string, number>();
  for (const r of rows) {
    const catId = idToCat.get(r.source_id);
    if (!catId) continue;
    byCat.set(catId, (byCat.get(catId) ?? 0) + Number(r.amount_gnf));
  }

  return Array.from(byCat.entries())
    .map(([categoryId, amount]) => {
      const c = catMap.get(categoryId);
      return {
        categoryId,
        name: c?.name ?? "—",
        color: c?.color ?? "#64748B",
        amount,
      };
    })
    .filter((s) => s.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

async function processWindow(
  supabase: SupabaseClient<Database>,
  from: string,
  to: string,
  filters: { categoryIds: string[]; createdByUserId: string | null },
  categoryRows: ExpenseCategoryRow[],
): Promise<{
  totalRevenue: number;
  totalExpenses: number;
  chartForDays: FinanceDayPoint[];
  expensesByCategory: FinanceCategorySlice[];
}> {
  const raw = await loadFtInWindow(supabase, from, to, filters.createdByUserId);
  const expIds = raw.filter((r) => r.source_type === "expense").map((r) => r.source_id);
  const idToCat = await mapExpenseSourceToCategory(supabase, expIds);
  const ftFiltered = applyCategoryFilter(raw, filters.categoryIds, idToCat);

  const rangeDays = buildDayLabels(from, to);
  const chartForDays = bucketByDay(ftFiltered, rangeDays);
  const totalRevenue = sumByType(ftFiltered, "sale");
  const totalExpenses = sumByType(ftFiltered, "expense");
  const expensesByCategory = await buildExpenseCategorySlices(supabase, ftFiltered, categoryRows);

  return {
    totalRevenue,
    totalExpenses,
    chartForDays,
    expensesByCategory,
  };
}

/**
 * Données CFO : KPI, comparaison période précédente, cashflow, graphiques.
 */
export async function getFinanceCfoData(
  supabase: SupabaseClient<Database>,
  params: FinanceQueryFilters,
): Promise<FinanceCfoData> {
  const { from, to, categoryIds, createdByUserId } = params;
  const filters = { categoryIds, createdByUserId };
  const { prevFrom, prevTo } = previousPeriodRange(from, to);
  const d7days = last7dDays(to);
  const d7from = d7days[0]?.date ?? to;
  const d7to = d7days[d7days.length - 1]?.date ?? to;

  const categoryRows = await listExpenseCategories();

  const [current, previous, d7w] = await Promise.all([
    processWindow(supabase, from, to, filters, categoryRows),
    processWindow(supabase, prevFrom, prevTo, filters, categoryRows),
    processWindow(supabase, d7from, d7to, filters, categoryRows),
  ]);

  const profit = current.totalRevenue - current.totalExpenses;
  const dayCount = Math.max(1, differenceInCalendarDays(parseISO(to), parseISO(from)) + 1);
  const marginPct =
    current.totalRevenue > 0 ? (profit / current.totalRevenue) * 100 : null;

  const chartInRange = current.chartForDays;
  const chartLast7d = d7w.chartForDays;
  const cashflowInRange = buildCashflow(chartInRange);

  const prevProfit = previous.totalRevenue - previous.totalExpenses;
  const delta: PeriodDelta = {
    revenuePct: pctChange(current.totalRevenue, previous.totalRevenue),
    expensesPct: pctChange(current.totalExpenses, previous.totalExpenses),
    profitPct: pctChange(profit, prevProfit),
  };

  return {
    totalRevenue: current.totalRevenue,
    totalExpenses: current.totalExpenses,
    profit,
    marginPct,
    avgDailyRevenue: current.totalRevenue / dayCount,
    avgDailyExpenses: current.totalExpenses / dayCount,
    dayCount,
    chartInRange,
    chartLast7d,
    cashflowInRange,
    expensesByCategory: current.expensesByCategory,
    previous: {
      totalRevenue: previous.totalRevenue,
      totalExpenses: previous.totalExpenses,
      profit: prevProfit,
    },
    delta,
  };
}

export async function getFinanceOverview(
  supabase: SupabaseClient<Database>,
  params: { from: string; to: string },
): Promise<FinanceOverview> {
  const d = await getFinanceCfoData(supabase, {
    from: params.from,
    to: params.to,
    categoryIds: [],
    createdByUserId: null,
  });
  return {
    totalRevenue: d.totalRevenue,
    totalExpenses: d.totalExpenses,
    profit: d.profit,
    chartInRange: d.chartInRange,
    chartLast7d: d.chartLast7d,
    expensesByCategory: d.expensesByCategory,
  };
}

export type CsvExportSections = {
  includeSummary: boolean;
  includeDeltas: boolean;
  includeDaily: boolean;
  includeCategories: boolean;
};

const CSV_ALL: CsvExportSections = {
  includeSummary: true,
  includeDeltas: true,
  includeDaily: true,
  includeCategories: true,
};

export function buildFinanceExportCsv(
  d: FinanceCfoData,
  from: string,
  to: string,
): string {
  return buildFinanceExportCsvSections(d, from, to, CSV_ALL);
}

export function buildFinanceExportCsvSections(
  d: FinanceCfoData,
  from: string,
  to: string,
  sections: CsvExportSections,
): string {
  const lines: string[] = ["Résumé financier RemPres", `Période;${from};${to}`, ""];

  if (sections.includeSummary) {
    lines.push(
      `Indicateur;Valeur (GNF)`,
      `Chiffre d'affaires;${Math.round(d.totalRevenue)}`,
      `Dépenses;${Math.round(d.totalExpenses)}`,
      `Résultat;${Math.round(d.profit)}`,
      `Marge %;${d.marginPct == null ? "" : d.marginPct.toFixed(1)}`,
      `Moyenne revenus / jour;${Math.round(d.avgDailyRevenue)}`,
      `Moyenne dépenses / jour;${Math.round(d.avgDailyExpenses)}`,
      "",
    );
  }

  if (sections.includeDeltas) {
    lines.push(
      "Évolution vs période précédente",
      `CA %;${d.delta.revenuePct == null ? "n/a" : d.delta.revenuePct.toFixed(1)}`,
      `Dépenses %;${d.delta.expensesPct == null ? "n/a" : d.delta.expensesPct.toFixed(1)}`,
      `Résultat %;${d.delta.profitPct == null ? "n/a" : d.delta.profitPct.toFixed(1)}`,
      "",
    );
  }

  if (sections.includeDaily) {
    lines.push(
      "Flux journaliers",
      `Date;Revenus;Dépenses;Net;Cumul`,
      ...d.cashflowInRange.map(
        (c) =>
          `${c.date};${Math.round(c.cashIn)};${Math.round(c.cashOut)};${Math.round(c.net)};${Math.round(
            c.cumulative,
          )}`,
      ),
      "",
    );
  }

  if (sections.includeCategories) {
    lines.push("Dépenses par catégorie", `Catégorie;Montant (GNF)`);
    for (const c of d.expensesByCategory) {
      lines.push(`${c.name};${Math.round(c.amount)}`);
    }
  }

  return "\uFEFF" + lines.join("\n");
}