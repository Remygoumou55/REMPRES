import type { DeptKpiPayload, DeptKpiStat } from "@/lib/dept/kpi-contract";

type WorkforceHeatmapCell = {
  day: string;
  value: number;
};

export type HrVisualFinalizationModel = {
  primaryStats: DeptKpiStat[];
  secondaryStats: DeptKpiStat[];
  chart: DeptKpiPayload["charts"][number] | null;
  alerts: DeptKpiPayload["alerts"];
  activity: DeptKpiPayload["activity"];
  heatmap: WorkforceHeatmapCell[];
};

export function buildHrVisualFinalizationModel(payload: DeptKpiPayload): HrVisualFinalizationModel {
  const stats = payload.stats ?? [];
  const chart = payload.charts?.[0] ?? null;
  const primaryStats = stats.slice(0, 4);
  const secondaryStats = stats.slice(4, 12);

  // Lightweight "staffing heatmap" from recent activity density.
  const seed = [0, 0, 0, 0, 0, 0, 0];
  for (const item of payload.activity ?? []) {
    if (!item.timestamp) continue;
    const d = new Date(item.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    const idx = d.getDay();
    seed[idx] += 1;
  }

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const heatmap = labels.map((day, i) => ({ day, value: seed[i] }));

  return {
    primaryStats,
    secondaryStats,
    chart,
    alerts: payload.alerts ?? [],
    activity: payload.activity ?? [],
    heatmap,
  };
}
