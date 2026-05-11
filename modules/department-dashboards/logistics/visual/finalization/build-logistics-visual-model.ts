import type { DeptKpiPayload, DeptKpiStat } from "@/lib/dept/kpi-contract";

export type LogisticsVisualHeatmapCell = { day: string; value: number };

export type LogisticsVisualFinalizationModel = {
  heroStats: DeptKpiStat[];
  scorecards: DeptKpiStat[];
  chart: DeptKpiPayload["charts"][number] | null;
  alerts: DeptKpiPayload["alerts"];
  activity: DeptKpiPayload["activity"];
  heatmap: LogisticsVisualHeatmapCell[];
};

export function buildLogisticsVisualFinalizationModel(payload: DeptKpiPayload): LogisticsVisualFinalizationModel {
  const seed = [0, 0, 0, 0, 0, 0, 0];
  for (const item of payload.activity ?? []) {
    if (!item.timestamp) continue;
    const d = new Date(item.timestamp);
    if (!Number.isNaN(d.getTime())) seed[d.getDay()] += 1;
  }
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    heroStats: (payload.stats ?? []).slice(0, 4),
    scorecards: (payload.stats ?? []).slice(4, 12),
    chart: payload.charts?.[0] ?? null,
    alerts: payload.alerts ?? [],
    activity: payload.activity ?? [],
    heatmap: labels.map((day, i) => ({ day, value: seed[i] })),
  };
}
