import { OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE } from "@/lib/navigation/erp-ux-architecture";
import { resolveEffectiveDepartmentKey } from "@/lib/navigation/home-route";
import { getDepartmentGovernanceHomeContext } from "@/lib/governance/home/load-home-context";
import { DepartmentCockpitPlaceholder } from "@/components/cockpit/DepartmentCockpitPlaceholder";

type DepartmentDashboardPageProps = {
  departmentKey: string;
};

/**
 * Cockpit département M3 — placeholder structure (pas help-center GovernanceHomeCenter).
 */
export async function DepartmentDashboardPage({ departmentKey }: DepartmentDashboardPageProps) {
  const context = await getDepartmentGovernanceHomeContext(departmentKey);
  const effective = resolveEffectiveDepartmentKey(context.departmentKey);
  const quickActions =
    (effective && OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE[effective]?.navGroups[0]?.links
      .slice(0, 3)
      .map((l) => l.href)) ??
    [];

  return (
    <DepartmentCockpitPlaceholder
      departmentKey={departmentKey}
      userDisplayName={context.userDisplayName}
      quickActionHrefs={quickActions}
    />
  );
}
