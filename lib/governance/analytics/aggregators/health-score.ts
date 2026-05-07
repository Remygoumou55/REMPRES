export function computeEnterpriseHealthScore(input: {
  unresolvedAlerts: number;
  pendingApprovals: number;
  criticalEvents7d: number;
  securityEvents7d: number;
  departmentsHealthy: number;
  departmentsTotal: number;
}): number {
  const departmentHealthRatio =
    input.departmentsTotal > 0 ? input.departmentsHealthy / input.departmentsTotal : 0;

  const penalties =
    input.unresolvedAlerts * 1.8 +
    input.pendingApprovals * 1.5 +
    input.criticalEvents7d * 2.3 +
    input.securityEvents7d * 2;

  const base = 100 * departmentHealthRatio;
  const score = Math.max(0, Math.min(100, Math.round(base - penalties)));
  return score;
}
