import { GovernanceActivityFeed } from "./GovernanceActivityFeed";
import type { GlobalGovernanceKpi } from "@/lib/governance/kpi/aggregate-kpi";

type DepartmentActivitySectionProps = {
  recentActivity: GlobalGovernanceKpi["recentActivity"];
};

export function DepartmentActivitySection({ recentActivity }: DepartmentActivitySectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Activite departements</h2>
      <GovernanceActivityFeed events={recentActivity} />
    </section>
  );
}
