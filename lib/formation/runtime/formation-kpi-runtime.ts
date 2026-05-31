/**
 * KPI runtime département Formation — données live (plus de stub placeholder).
 */

import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getFormationDashboardKpis } from "@/lib/server/formation";

export const FORMATION_RUNTIME_KPI_SOURCE = "formation-runtime-kpi-v1" as const;

export async function buildDeptFormationKpiPayload(now = new Date()): Promise<DeptKpiPayload> {
  const kpis = await getFormationDashboardKpis();

  return {
    stats: [
      {
        id: "activeTrainings",
        label: "dashboard.dept.kpi.activeTrainings",
        value: kpis.activeTrainings,
        unit: "count",
      },
      {
        id: "totalTrainees",
        label: "dashboard.dept.kpi.totalTrainees",
        value: kpis.totalTrainees,
        unit: "count",
      },
      {
        id: "certificatesIssued",
        label: "dashboard.dept.kpi.certificatesIssued",
        value: kpis.certificatesIssued,
        unit: "count",
      },
      {
        id: "revenueThisMonth",
        label: "dashboard.dept.kpi.revenueThisMonth",
        value: kpis.revenueThisMonth,
        unit: "currency",
      },
    ],
    charts:
      kpis.chart7Days.length > 0
        ? [
            {
              id: "enrollmentRevenue7d",
              title: "dashboard.dept.chart.enrollmentRevenue",
              kind: "bar",
              xKey: "x",
              series: [{ key: "revenue", label: "GNF" }],
              points: kpis.chart7Days.map((p) => ({
                x: p.date,
                revenue: p.value,
              })),
            },
          ]
        : [],
    alerts: [],
    activity: kpis.recentActivity.map((a) => ({
      id: a.id,
      label: `${a.actor} — ${a.module}`,
      timestamp: a.timeAgo,
    })),
    health: { status: "ok" },
    metadata: {
      source: FORMATION_RUNTIME_KPI_SOURCE,
      generatedAt: now.toISOString(),
      placeholder: false,
    },
  };
}
