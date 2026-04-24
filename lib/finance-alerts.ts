/**
 * Alertes pilotage (règles pures) — paramètres fournis par l’app (souvent localStorage).
 */
import type { FinanceCfoData } from "@/lib/server/finance-overview";

export type FinanceAlertLevel = "critical" | "warning" | "info";

export type FinanceAlertItem = {
  id: string;
  level: FinanceAlertLevel;
  title: string;
  message: string;
};

export type FinanceAlertSettings = {
  /** 0 = désactivé. Alerte si une journée a des dépenses &gt; ce seuil (GNF). */
  maxDayExpenseGnf: number;
  /** Alerte si l’évolution du CA &lt; ce % vs période préc. (ex. -5 = alerte si &lt; -5%). */
  minRevenueDeltaPct: number;
  /** Alerter si le résultat de la période est négatif */
  warnNegativeProfit: boolean;
};

export const DEFAULT_ALERT_SETTINGS: FinanceAlertSettings = {
  maxDayExpenseGnf: 0,
  minRevenueDeltaPct: -8,
  warnNegativeProfit: true,
};

const STORAGE_KEY = "rempres-finance-alert-settings";

export function loadAlertSettings(): FinanceAlertSettings {
  if (typeof window === "undefined") return { ...DEFAULT_ALERT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ALERT_SETTINGS };
    const p = JSON.parse(raw) as Partial<FinanceAlertSettings>;
    return {
      maxDayExpenseGnf:
        typeof p.maxDayExpenseGnf === "number" ? p.maxDayExpenseGnf : DEFAULT_ALERT_SETTINGS.maxDayExpenseGnf,
      minRevenueDeltaPct:
        typeof p.minRevenueDeltaPct === "number"
          ? p.minRevenueDeltaPct
          : DEFAULT_ALERT_SETTINGS.minRevenueDeltaPct,
      warnNegativeProfit:
        typeof p.warnNegativeProfit === "boolean" ? p.warnNegativeProfit : DEFAULT_ALERT_SETTINGS.warnNegativeProfit,
    };
  } catch {
    return { ...DEFAULT_ALERT_SETTINGS };
  }
}

export function saveAlertSettings(s: FinanceAlertSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/**
 * Construit la liste d’alertes (ordre: critique → avertissement → info).
 */
export function computeFinanceAlerts(
  d: FinanceCfoData,
  settings: FinanceAlertSettings,
): FinanceAlertItem[] {
  const out: FinanceAlertItem[] = [];

  if (settings.warnNegativeProfit && d.profit < 0) {
    out.push({
      id: "neg-profit",
      level: "critical",
      title: "Résultat négatif",
      message: "Le résultat (CA − dépenses) est négatif sur la période sélectionnée.",
    });
  }

  if (d.delta.revenuePct != null && d.delta.revenuePct < settings.minRevenueDeltaPct) {
    out.push({
      id: "revenue-drop",
      level: d.delta.revenuePct < settings.minRevenueDeltaPct * 1.5 ? "critical" : "warning",
      title: "Baisse du chiffre d'affaires",
      message: `Le CA a varié de ${d.delta.revenuePct.toFixed(1)}% par rapport à la période précédente (seuil: ${settings.minRevenueDeltaPct}%).`,
    });
  }

  if (settings.maxDayExpenseGnf > 0) {
    for (const row of d.chartInRange) {
      if (row.expenses > settings.maxDayExpenseGnf) {
        out.push({
          id: `day-exp-${row.date}`,
          level: "warning",
          title: "Dépenses journalières élevées",
          message: `Le ${row.date}, les dépenses (${Math.round(row.expenses).toLocaleString("fr-FR")} GNF) dépassent le seuil (${settings.maxDayExpenseGnf.toLocaleString("fr-FR")} GNF).`,
        });
        break; // une alerte regroupée suffit
      }
    }
  }

  return out;
}
