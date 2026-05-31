/**
 * KPI runtime département Marketing — données live (plus de stub placeholder).
 */

import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import { getMarketingDashboardKpis } from "@/lib/server/marketing";

export const MARKETING_RUNTIME_KPI_SOURCE = "marketing-runtime-kpi-v1" as const;

export async function buildDeptMarketingKpiPayload(now = new Date()): Promise<DeptKpiPayload> {
  const kpis = await getMarketingDashboardKpis();

  const levelMap = { HIGH: "critical", MEDIUM: "warning", LOW: "info" } as const;

  return {
    stats: [
      {
        id: "totalCampaigns",
        label: "dashboard.dept.kpi.totalCampaigns",
        value: kpis.totalCampaigns,
        unit: "count",
      },
      {
        id: "activeCampaigns",
        label: "dashboard.dept.kpi.activeCampaigns",
        value: kpis.activeCampaigns,
        unit: "count",
      },
      {
        id: "totalLeads",
        label: "dashboard.dept.kpi.totalLeads",
        value: kpis.totalLeads,
        unit: "count",
      },
      {
        id: "conversionRate",
        label: "dashboard.dept.kpi.conversionRate",
        value: kpis.conversionRate,
        unit: "percent",
      },
    ],
    charts:
      kpis.chart7Days.length > 0
        ? [
            {
              id: "leads7d",
              title: "dashboard.dept.chart.leadsTrend",
              kind: "line",
              xKey: "x",
              series: [{ key: "leads", label: "Leads" }],
              points: kpis.chart7Days.map((p) => ({
                x: p.date,
                leads: p.value,
              })),
            },
          ]
        : [],
    alerts: kpis.alerts.map((a) => ({
      id: a.id,
      level: levelMap[a.level],
      message: a.title,
      timestamp: a.time,
    })),
    activity: kpis.recentActivity.map((a) => ({
      id: a.id,
      label: `${a.actor} — ${a.module}`,
      timestamp: a.timeAgo,
    })),
    health: { status: "ok" },
    metadata: {
      source: MARKETING_RUNTIME_KPI_SOURCE,
      generatedAt: now.toISOString(),
      placeholder: false,
    },
  };
}
