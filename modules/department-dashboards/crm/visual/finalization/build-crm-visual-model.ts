import type { DeptKpiPayload, DeptKpiStat } from "@/lib/dept/kpi-contract";

export type CrmVisualHeatmapCell = {
  day: string;
  value: number;
};

export type CrmVisualFinalizationModel = {
  heroStats: DeptKpiStat[];
  scorecards: DeptKpiStat[];
  chart: DeptKpiPayload["charts"][number] | null;
  alerts: DeptKpiPayload["alerts"];
  activity: DeptKpiPayload["activity"];
  heatmap: CrmVisualHeatmapCell[];
};

export function buildCrmVisualFinalizationModel(payload: DeptKpiPayload): CrmVisualFinalizationModel {
  const stats = payload.stats ?? [];
  const chart = payload.charts?.[0] ?? null;
  const seed = [0, 0, 0, 0, 0, 0, 0];

  for (const item of payload.activity ?? []) {
    if (!item.timestamp) continue;
    const d = new Date(item.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    seed[d.getDay()] += 1;
  }

  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    heroStats: stats.slice(0, 4),
    scorecards: stats.slice(4, 12),
    chart,
    alerts: payload.alerts ?? [],
    activity: payload.activity ?? [],
    heatmap: labels.map((day, i) => ({ day, value: seed[i] })),
  };
}
