/**
 * Bilan financier mensuel — agrégation ventes, dépenses, transactions.
 */
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { listExpenseCategories, type ExpenseCategoryRow } from "@/lib/server/expenses";

export type ExpenseByCategory = {
  category: string;
  total_gnf: number;
  count: number;
  percentage: number;
};

export type MonthlyComparison = {
  month: string;
  month_label: string;
  revenue_gnf: number;
  expenses_gnf: number;
  net_gnf: number;
};

export type MonthlyReportData = {
  period: {
    month: number;
    year: number;
    label: string;
    start: string;
    end: string;
  };
  revenue: {
    sales_gnf: number;
    other_gnf: number;
    total_gnf: number;
  };
  expenses: {
    total_gnf: number;
    by_category: ExpenseByCategory[];
  };
  result: {
    net_gnf: number;
    margin_pct: number;
  };
  comparison: MonthlyComparison[];
  generated_at: string;
  generated_by_name: string;
};

const FR_MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

function monthBounds(year: number, month: number): {
  startISO: string;
  endISO: string;
  startDate: string;
  endDate: string;
} {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    startDate: `${year}-${pad(month)}-01`,
    endDate: `${year}-${pad(month)}-${pad(end.getDate())}`,
  };
}

type SaleRow = {
  total_amount_gnf: number | null;
  lifecycle_status: string | null;
  payment_status: string | null;
};

type ExpenseRow = {
  amount_gnf: number | null;
  category_id: string | null;
};

type FtRow = {
  amount_gnf: number | null;
  source_type: string | null;
  status: string | null;
};

function isValidatedSale(s: SaleRow): boolean {
  if (s.lifecycle_status === "validated") return true;
  const ps = s.payment_status;
  return ps === "paid" || ps === "partial";
}

function sumSalesRevenue(rows: SaleRow[]): number {
  return rows
    .filter(isValidatedSale)
    .reduce((sum, s) => sum + Number(s.total_amount_gnf ?? 0), 0);
}

function sumOtherRevenue(rows: FtRow[]): number {
  return rows
    .filter(
      (t) =>
        t.status !== "cancelled" &&
        (t.source_type === "training" || t.source_type === "consultation"),
    )
    .reduce((sum, t) => sum + Number(t.amount_gnf ?? 0), 0);
}

function buildExpenseCategories(
  expenses: ExpenseRow[],
  categoryMap: Map<string, string>,
): { byCategory: ExpenseByCategory[]; total: number } {
  const catMap = new Map<string, { total: number; count: number }>();

  for (const exp of expenses) {
    const catId = exp.category_id ?? "other";
    const cat = categoryMap.get(catId) ?? "Autres";
    const amount = Number(exp.amount_gnf ?? 0);
    const existing = catMap.get(cat);
    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      catMap.set(cat, { total: amount, count: 1 });
    }
  }

  const total = Array.from(catMap.values()).reduce((s, v) => s + v.total, 0);
  const byCategory: ExpenseByCategory[] = Array.from(catMap.entries())
    .map(([category, v]) => ({
      category,
      total_gnf: Math.round(v.total),
      count: v.count,
      percentage:
        total > 0 ? Math.round((v.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.total_gnf - a.total_gnf);

  return { byCategory, total };
}

async function loadMonthAggregates(
  year: number,
  month: number,
  categoryMap: Map<string, string>,
): Promise<{ revenue: number; expenses: number }> {
  const supabase = getSupabaseServerClient();
  const { startISO, endISO, startDate, endDate } = monthBounds(year, month);

  const [salesRes, expensesRes, ftRes] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount_gnf, lifecycle_status, payment_status")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .is("deleted_at", null),
    supabase
      .from("expenses")
      .select("amount_gnf, category_id")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .is("deleted_at", null),
    supabase
      .from("financial_transactions")
      .select("amount_gnf, source_type, status")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .in("source_type", ["training", "consultation"]),
  ]);

  const sales = (salesRes.data ?? []) as SaleRow[];
  const expenses = (expensesRes.data ?? []) as ExpenseRow[];
  const ft = (ftRes.data ?? []) as FtRow[];

  const revenue = Math.round(sumSalesRevenue(sales) + sumOtherRevenue(ft));
  const { total: expensesTotal } = buildExpenseCategories(expenses, categoryMap);

  return { revenue, expenses: Math.round(expensesTotal) };
}

function categoryNameMap(categories: ExpenseCategoryRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const c of categories) {
    map.set(c.id, c.name);
  }
  return map;
}

export async function getMonthlyReportData(
  month: number,
  year: number,
  generatedByName: string,
): Promise<MonthlyReportData> {
  const supabase = getSupabaseServerClient();
  const { startISO, endISO, startDate, endDate } = monthBounds(year, month);

  const categories = await listExpenseCategories().catch(() => [] as ExpenseCategoryRow[]);
  const categoryMap = categoryNameMap(categories);

  const [salesRes, expensesRes, ftRes] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount_gnf, lifecycle_status, payment_status, created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .is("deleted_at", null),
    supabase
      .from("expenses")
      .select("amount_gnf, category_id, description, expense_date, created_at")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .is("deleted_at", null),
    supabase
      .from("financial_transactions")
      .select("amount_gnf, source_type, status, description, created_at")
      .gte("created_at", startISO)
      .lte("created_at", endISO)
      .in("source_type", ["training", "consultation"]),
  ]);

  const sales = (salesRes.data ?? []) as SaleRow[];
  const expenses = (expensesRes.data ?? []) as ExpenseRow[];
  const ft = (ftRes.data ?? []) as FtRow[];

  const salesRevenue = sumSalesRevenue(sales);
  const otherRevenue = sumOtherRevenue(ft);
  const totalRevenue = salesRevenue + otherRevenue;

  const { byCategory, total: totalExpenses } = buildExpenseCategories(
    expenses,
    categoryMap,
  );

  const netGnf = totalRevenue - totalExpenses;
  const marginPct =
    totalRevenue > 0
      ? Math.round((netGnf / totalRevenue) * 1000) / 10
      : 0;

  const comparisonMonths = [2, 1, 0].map((i) => {
    const d = new Date(year, month - 1 - i, 1);
    return { m: d.getMonth() + 1, y: d.getFullYear() };
  });
  const comparisonAggs = await Promise.all(
    comparisonMonths.map(({ m, y }) => loadMonthAggregates(y, m, categoryMap)),
  );
  const comparison: MonthlyComparison[] = comparisonMonths.map(({ m, y }, idx) => {
    const agg = comparisonAggs[idx]!;
    return {
      month: `${y}-${String(m).padStart(2, "0")}`,
      month_label: `${FR_MONTHS[m - 1]!.slice(0, 3)} ${y}`,
      revenue_gnf: agg.revenue,
      expenses_gnf: agg.expenses,
      net_gnf: Math.round(agg.revenue - agg.expenses),
    };
  });

  return {
    period: {
      month,
      year,
      label: `${FR_MONTHS[month - 1]} ${year}`,
      start: startISO,
      end: endISO,
    },
    revenue: {
      sales_gnf: Math.round(salesRevenue),
      other_gnf: Math.round(otherRevenue),
      total_gnf: Math.round(totalRevenue),
    },
    expenses: {
      total_gnf: Math.round(totalExpenses),
      by_category: byCategory,
    },
    result: {
      net_gnf: Math.round(netGnf),
      margin_pct: marginPct,
    },
    comparison,
    generated_at: new Date().toISOString(),
    generated_by_name: generatedByName,
  };
}

/** Résumés des N derniers mois (tableau bilans). */
export async function listRecentMonthlySummaries(
  count: number,
  anchorYear: number,
  anchorMonth: number,
): Promise<
  {
    month: number;
    year: number;
    label: string;
    revenue_gnf: number;
    expenses_gnf: number;
    net_gnf: number;
  }[]
> {
  const categories = await listExpenseCategories().catch(() => [] as ExpenseCategoryRow[]);
  const categoryMap = categoryNameMap(categories);

  const months = Array.from({ length: count }, (_, i) => {
    const d = new Date(anchorYear, anchorMonth - 1 - i, 1);
    return { m: d.getMonth() + 1, y: d.getFullYear() };
  });
  const aggs = await Promise.all(
    months.map(({ m, y }) => loadMonthAggregates(y, m, categoryMap)),
  );

  return months.map(({ m, y }, idx) => {
    const agg = aggs[idx]!;
    return {
      month: m,
      year: y,
      label: `${FR_MONTHS[m - 1]!.slice(0, 3)} ${y}`,
      revenue_gnf: agg.revenue,
      expenses_gnf: agg.expenses,
      net_gnf: Math.round(agg.revenue - agg.expenses),
    };
  });
}
