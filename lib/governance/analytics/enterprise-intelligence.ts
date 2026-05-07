import { cache } from "react";
import { aggregateGlobalGovernanceKpi } from "@/lib/governance/kpi/aggregate-kpi";
import { listGovernanceAlerts } from "@/lib/governance/alerts/repository";
import { getComplianceHealth } from "@/lib/governance/audit/repository";
import { listApprovalRequests } from "@/lib/governance/approvals/repository";
import { buildDepartmentComparisonRows } from "@/lib/governance/analytics/aggregators/department-comparison";
import { buildTrendAnalysis } from "@/lib/governance/analytics/aggregators/trend-analysis";
import { computeEnterpriseHealthScore } from "@/lib/governance/analytics/aggregators/health-score";

export const loadEnterpriseIntelligence = cache(async (period: "7d" | "30d" | "90d" = "30d") => {
  const windowLimit = period === "7d" ? 100 : period === "90d" ? 300 : 200;
  const [globalKpi, unresolvedAlerts, compliance, pendingApprovals] = await Promise.all([
    aggregateGlobalGovernanceKpi(),
    listGovernanceAlerts({ status: "unread", limit: windowLimit }),
    getComplianceHealth(),
    listApprovalRequests({ status: "pending", limit: windowLimit }),
  ]);

  const comparisonRows = buildDepartmentComparisonRows(globalKpi.departments);
  const trend = buildTrendAnalysis({
    salesToday: globalKpi.enterprise.salesToday,
    salesMonth: globalKpi.enterprise.salesMonth,
    unresolvedAlerts: unresolvedAlerts.length,
    pendingApprovals: pendingApprovals.length,
    securityEvents7d: compliance.securityEvents7d,
  });

  const departmentsHealthy = globalKpi.departments.filter((d) => d.health === "healthy").length;
  const healthScore = computeEnterpriseHealthScore({
    unresolvedAlerts: unresolvedAlerts.length,
    pendingApprovals: pendingApprovals.length,
    criticalEvents7d: compliance.criticalEvents7d,
    securityEvents7d: compliance.securityEvents7d,
    departmentsHealthy,
    departmentsTotal: globalKpi.departments.length,
  });

  return {
    enterprise: globalKpi.enterprise,
    departments: globalKpi.departments,
    comparisonRows,
    trend,
    healthScore,
    compliance,
    pendingApprovals: pendingApprovals.length,
    unresolvedAlerts: unresolvedAlerts.length,
  };
});
