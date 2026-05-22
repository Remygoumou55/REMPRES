import type { DayStats } from "@/lib/server/dashboard-kpis";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";

export function statValue(payload: DeptKpiPayload | undefined, id: string): number {
  const v = payload?.stats.find((s) => s.id === id)?.value;
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function splitWindowTrendFromDays(days: DayStats[], amountKey: "amount" | "count" = "amount"): {
  pct: number;
  up: boolean;
  label: string;
} {
  if (!days.length) return { pct: 0, up: true, label: "—" };
  const mid = Math.max(1, Math.floor(days.length / 2));
  const a = days.slice(0, mid).reduce((s, d) => s + (amountKey === "count" ? d.count : d.amount), 0);
  const b = days.slice(mid).reduce((s, d) => s + (amountKey === "count" ? d.count : d.amount), 0);
  const base = Math.max(a, 1e-9);
  const raw = ((b - a) / base) * 100;
  const pct = Math.min(999, Math.abs(raw));
  return {
    pct,
    up: raw >= 0,
    label: `${raw >= 0 ? "+" : "−"}${pct.toFixed(1)}%`,
  };
}

export function normalizeSpark(values: number[]): number[] {
  const max = Math.max(...values.map((x) => Math.abs(x)), 1e-9);
  return values.map((x) => Math.max(0.08, (Math.abs(x) / max) * 1));
}

export function healthBadge(
  health: DeptKpiPayload["health"] | undefined,
  placeholder?: boolean,
): { label: string; tone: "ok" | "warn" | "bad" } {
  if (placeholder || health?.status === "placeholder") {
    return { label: "Agrégation partielle", tone: "warn" };
  }
  if (health?.status === "degraded") return { label: "Dégradé", tone: "warn" };
  return { label: "Stable", tone: "ok" };
}
