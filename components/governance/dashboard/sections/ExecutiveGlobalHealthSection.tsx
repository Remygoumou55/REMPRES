import { EnterpriseOverviewCard } from "@/components/governance/dashboard/EnterpriseOverviewCard";

type ExecutiveGlobalHealthSectionProps = {
  titleByKey: (key: string) => string;
  activeDepartments: number;
  activeUsers: number;
  sensitiveActions24h: number;
  unresolvedAlerts: number;
};

export function ExecutiveGlobalHealthSection({
  titleByKey,
  activeDepartments,
  activeUsers,
  sensitiveActions24h,
  unresolvedAlerts,
}: ExecutiveGlobalHealthSectionProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <EnterpriseOverviewCard
        title={titleByKey("governance.dashboard.executive.activeDepartments")}
        value={String(activeDepartments)}
        subtitle={titleByKey("governance.dashboard.executive.activeDepartmentsHint")}
      />
      <EnterpriseOverviewCard
        title={titleByKey("governance.dashboard.executive.activeUsers")}
        value={String(activeUsers)}
        subtitle={titleByKey("governance.dashboard.executive.activeUsersHint")}
      />
      <EnterpriseOverviewCard
        title={titleByKey("governance.dashboard.executive.sensitiveActions24h")}
        value={String(sensitiveActions24h)}
        subtitle={titleByKey("governance.dashboard.executive.sensitiveActions24hHint")}
      />
      <EnterpriseOverviewCard
        title={titleByKey("governance.dashboard.executive.unresolvedAlerts")}
        value={String(unresolvedAlerts)}
        subtitle={titleByKey("governance.dashboard.executive.unresolvedAlertsHint")}
      />
    </section>
  );
}
