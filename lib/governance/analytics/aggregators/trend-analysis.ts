export type TrendPoint = {
  label: string;
  value: number;
};

export type TrendAnalysis = {
  growthTrend: "up" | "down" | "stable";
  incidentTrend: "up" | "down" | "stable";
  approvalBottleneck: "healthy" | "watch" | "critical";
  points: TrendPoint[];
};

function trendFromValues(current: number, baseline: number): "up" | "down" | "stable" {
  if (current > baseline * 1.05) return "up";
  if (current < baseline * 0.95) return "down";
  return "stable";
}

export function buildTrendAnalysis(input: {
  salesToday: number;
  salesMonth: number;
  unresolvedAlerts: number;
  pendingApprovals: number;
  securityEvents7d: number;
}): TrendAnalysis {
  const monthlyDailyBaseline = input.salesMonth > 0 ? input.salesMonth / 30 : 0;
  const growthTrend = trendFromValues(input.salesToday, monthlyDailyBaseline);

  const incidentScoreCurrent = input.unresolvedAlerts + input.securityEvents7d;
  const incidentScoreBaseline = Math.max(1, input.securityEvents7d);
  const incidentTrend = trendFromValues(incidentScoreCurrent, incidentScoreBaseline);

  const approvalBottleneck =
    input.pendingApprovals >= 15 ? "critical" : input.pendingApprovals >= 6 ? "watch" : "healthy";

  return {
    growthTrend,
    incidentTrend,
    approvalBottleneck,
    points: [
      { label: "Sales today", value: input.salesToday },
      { label: "Daily baseline", value: Math.round(monthlyDailyBaseline) },
      { label: "Unresolved alerts", value: input.unresolvedAlerts },
      { label: "Pending approvals", value: input.pendingApprovals },
    ],
  };
}
