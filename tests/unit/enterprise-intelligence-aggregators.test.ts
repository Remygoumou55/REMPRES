import { describe, expect, it } from "vitest";
import { buildDepartmentComparisonRows } from "@/lib/governance/analytics/aggregators/department-comparison";
import { buildTrendAnalysis } from "@/lib/governance/analytics/aggregators/trend-analysis";
import { computeEnterpriseHealthScore } from "@/lib/governance/analytics/aggregators/health-score";

describe("enterprise intelligence aggregators", () => {
  it("ranks departments by productivity", () => {
    const rows = buildDepartmentComparisonRows([
      {
        departmentKey: "VENTE",
        departmentLabel: "Vente",
        usersCount: 10,
        managersCount: 2,
        activityCount7d: 40,
        health: "healthy",
      },
      {
        departmentKey: "FINANCE",
        departmentLabel: "Finance",
        usersCount: 8,
        managersCount: 2,
        activityCount7d: 20,
        health: "watch",
      },
    ]);

    expect(rows[0]?.departmentKey).toBe("VENTE");
    expect(rows[0]?.rank).toBe(1);
  });

  it("builds trend analysis and bottleneck status", () => {
    const trend = buildTrendAnalysis({
      salesToday: 50,
      salesMonth: 900,
      unresolvedAlerts: 3,
      pendingApprovals: 10,
      securityEvents7d: 2,
    });

    expect(trend.approvalBottleneck).toBe("watch");
    expect(trend.points.length).toBeGreaterThan(0);
  });

  it("computes bounded enterprise health score", () => {
    const score = computeEnterpriseHealthScore({
      unresolvedAlerts: 2,
      pendingApprovals: 4,
      criticalEvents7d: 1,
      securityEvents7d: 1,
      departmentsHealthy: 4,
      departmentsTotal: 6,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
