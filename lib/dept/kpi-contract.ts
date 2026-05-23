import type { ActivityItem } from "@/components/dashboard/activity-feed";

export type DeptKpiStat = {
  id: string;
  label: string;
  value: number;
  unit?: "count" | "currency" | "percent";
};

export type DeptKpiChartSeries = {
  key: string;
  label: string;
};

export type DeptKpiChartPoint = {
  x: string;
  [seriesKey: string]: string | number;
};

export type DeptKpiChart = {
  id: string;
  title: string;
  kind: "line" | "area" | "bar";
  xKey: string;
  series: DeptKpiChartSeries[];
  points: DeptKpiChartPoint[];
};

export type DeptKpiAlert = {
  id: string;
  level: "info" | "warning" | "critical";
  message: string;
  timestamp?: string;
};

export type DeptKpiActivity = {
  id: string;
  label: string;
  timestamp?: string;
};

export type DeptKpiHealth = {
  status: "ok" | "degraded" | "placeholder";
  notes?: string[];
};

export type DeptKpiMetadata = {
  source: string;
  generatedAt: string;
  placeholder?: boolean;
};

export type DeptKpiPayload = {
  stats: DeptKpiStat[];
  charts: DeptKpiChart[];
  alerts: DeptKpiAlert[];
  activity: DeptKpiActivity[];
  health: DeptKpiHealth;
  metadata: DeptKpiMetadata;
};

export type DeptKpiApiResponse = {
  dept: string;
  data: DeptKpiPayload;
  activities: ActivityItem[];
  lastUpdated: string;
};

