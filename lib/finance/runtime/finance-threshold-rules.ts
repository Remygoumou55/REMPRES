/**
 * P6.1 — Règles seuils trésorerie (gouvernées, read-only evaluation).
 */

export const FINANCE_THRESHOLD_RULES_VERSION = "finance-threshold-rules-p6-1-v1" as const;

export type FinanceThresholdMetric =
  | "expensesMonth"
  | "expensesToday"
  | "profitMonth"
  | "netRevenueMonth";

export type FinanceThresholdCompare = "above" | "below";

export type FinanceTreasuryThresholdRule = {
  key: string;
  description: string;
  metric: FinanceThresholdMetric;
  compare: FinanceThresholdCompare;
  thresholdGnf: number;
  period: "day" | "month";
  enabled: boolean;
};

/** Seuils officiels P6.1 — ajustables via variables d'environnement. */
function envThreshold(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const FINANCE_TREASURY_THRESHOLD_RULES: readonly FinanceTreasuryThresholdRule[] = [
  {
    key: "cfo_negative_profit_month",
    description: "Résultat net mensuel négatif",
    metric: "profitMonth",
    compare: "below",
    thresholdGnf: 0,
    period: "month",
    enabled: true,
  },
  {
    key: "cfo_monthly_expenses_ceiling",
    description: "Plafond dépenses mensuelles",
    metric: "expensesMonth",
    compare: "above",
    thresholdGnf: envThreshold("FINANCE_THRESHOLD_MONTHLY_EXPENSES_GNF", 500_000_000),
    period: "month",
    enabled: true,
  },
  {
    key: "cfo_daily_expenses_ceiling",
    description: "Plafond dépenses journalières",
    metric: "expensesToday",
    compare: "above",
    thresholdGnf: envThreshold("FINANCE_THRESHOLD_DAILY_EXPENSES_GNF", 50_000_000),
    period: "day",
    enabled: true,
  },
] as const;
