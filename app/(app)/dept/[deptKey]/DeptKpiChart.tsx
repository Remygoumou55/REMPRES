"use client";

import { DashboardChartFromSpec } from "@/modules/dashboard-system/charts";
import type { DeptKpiChart as DeptKpiChartType } from "@/lib/dept/kpi-contract";

export function DeptKpiChart(props: { chart: DeptKpiChartType | null; emptyMessage: string }) {
  return <DashboardChartFromSpec {...props} />;
}
