"use client";

import type { DeptKpiChart } from "@/lib/dept/kpi-contract";
import { DashboardChartFromSpec } from "@/modules/dashboard-system/charts";

export function RhVisualPrimaryChart({ chart, emptyMessage }: { chart: DeptKpiChart | null; emptyMessage: string }) {
  return <DashboardChartFromSpec chart={chart} emptyMessage={emptyMessage} />;
}
