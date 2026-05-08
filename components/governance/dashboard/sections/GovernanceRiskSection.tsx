import { GovernanceMetricsCard } from "@/components/governance/dashboard/GovernanceMetricsCard";
import {
  EXEC_CARD,
  EXEC_CARD_MIN_H,
  EXEC_CARD_PAD,
  EXEC_SECTION_TITLE,
} from "@/components/executive/tokens";

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
    <section className={`${EXEC_CARD} ${EXEC_CARD_PAD} ${EXEC_CARD_MIN_H}`}>
      <h2 className={EXEC_SECTION_TITLE}>
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
