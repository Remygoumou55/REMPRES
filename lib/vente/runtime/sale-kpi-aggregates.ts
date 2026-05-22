/**
 * B2.0 — Agrégation CA ventes (définition nette unique, B1.4 §7.2).
 */

export type SaleKpiRow = {
  total_amount_gnf: number | null;
  payment_status: string | null;
  created_at: string;
};

export type SaleAmountSummary = {
  count: number;
  grossSaleAmount: number;
  cancelledSaleAmount: number;
  netSaleAmount: number;
};

export function summarizeSaleAmounts(rows: SaleKpiRow[] | null): SaleAmountSummary {
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

export const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;

export function buildLast7Days(): { iso: string; label: string }[] {
  const result: { iso: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    result.push({ iso, label: DAY_LABELS[d.getDay()] });
  }
  return result;
}

export type DayStats = {
  date: string;
  label: string;
  amount: number;
  count: number;
};

export function buildSalesLast7DaysNet(weekRows: SaleKpiRow[] | null): DayStats[] {
  const days = buildLast7Days();
  return days.map(({ iso, label }) => {
    const dayRows = (weekRows ?? []).filter((r) => r.created_at.slice(0, 10) === iso);
    const dayNet = summarizeSaleAmounts(dayRows).netSaleAmount;
    return {
      date: iso,
      label,
      amount: dayNet,
      count: dayRows.length,
    };
  });
}
