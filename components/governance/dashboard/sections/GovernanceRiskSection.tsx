import { GovernanceMetricsCard } from "@/components/governance/dashboard/GovernanceMetricsCard";

type GovernanceRiskSectionProps = {
  titleByKey: (key: string) => string;
  unresolvedAlerts: number;
  pendingApprovals: number;
  criticalAuditEvents7d: number;
  securityAuditEvents7d: number;
};

export function GovernanceRiskSection({
  titleByKey,
  unresolvedAlerts,
  pendingApprovals,
  criticalAuditEvents7d,
  securityAuditEvents7d,
}: GovernanceRiskSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">
        {titleByKey("governance.dashboard.risk.title")}
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <GovernanceMetricsCard
          label={titleByKey("governance.dashboard.risk.unresolvedAlerts")}
          value={String(unresolvedAlerts)}
        />
        <GovernanceMetricsCard
          label={titleByKey("governance.dashboard.risk.pendingApprovals")}
          value={String(pendingApprovals)}
        />
        <GovernanceMetricsCard
          label={titleByKey("governance.dashboard.risk.criticalAuditEvents7d")}
          value={String(criticalAuditEvents7d)}
        />
        <GovernanceMetricsCard
          label={titleByKey("governance.dashboard.risk.securityAuditEvents7d")}
          value={String(securityAuditEvents7d)}
        />
      </div>
    </section>
  );
}
