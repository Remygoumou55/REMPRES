"use client";

import { DashboardChartFromSpec } from "@/modules/dashboard-system/charts";
import type { DeptKpiChart } from "@/lib/dept/kpi-contract";

export type ExecutiveDomainChartProps = {
  chart: DeptKpiChart | null;
  emptyMessage: string;
};

export function ExecutiveDomainChart(props: ExecutiveDomainChartProps) {
  return <DashboardChartFromSpec {...props} />;
}
