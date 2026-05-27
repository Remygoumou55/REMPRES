import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { MonthlyDataPoint } from "@/lib/utils/forecast";

export type MonthlySalesData = {
  months: MonthlyDataPoint[];
  total_12m: number;
  avg_monthly: number;
  best_month: MonthlyDataPoint | null;
  worst_month: MonthlyDataPoint | null;
};

const FR_MONTHS_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
] as const;

export async function getLast12MonthsSales(): Promise<MonthlySalesData> {
  const supabase = getSupabaseServerClient();

  const thirteenMonthsAgo = new Date();
  thirteenMonthsAgo.setMonth(thirteenMonthsAgo.getMonth() - 13);

  const { data: sales } = await supabase
    .from("sales")
    .select("total_amount_gnf, lifecycle_status, payment_status, created_at")
    .gte("created_at", thirteenMonthsAgo.toISOString())
    .is("deleted_at", null);

  const monthMap = new Map<string, number>();

  for (const sale of sales ?? []) {
    const isValidated =
      sale.lifecycle_status === "validated" ||
      sale.payment_status === "paid" ||
      sale.payment_status === "partial";
    if (!isValidated) continue;

    const monthKey = sale.created_at.slice(0, 7);
    const amount = Number(sale.total_amount_gnf ?? 0);
    monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + amount);
  }

  const now = new Date();
  const months: MonthlyDataPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${FR_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
    months.push({
      month: key,
      month_label: label,
      revenue_gnf: Math.round(monthMap.get(key) ?? 0),
      is_forecast: false,
    });
  }

  const total12m = months.reduce((s, m) => s + m.revenue_gnf, 0);

  if (total12m === 0) {
    return { months, total_12m: 0, avg_monthly: 0, best_month: null, worst_month: null };
  }

  const avg = Math.round(total12m / 12);
  const sorted = [...months].sort((a, b) => b.revenue_gnf - a.revenue_gnf);

  return {
    months,
    total_12m: total12m,
    avg_monthly: avg,
    best_month: sorted[0] ?? null,
    worst_month: sorted[sorted.length - 1] ?? null,
  };
}
