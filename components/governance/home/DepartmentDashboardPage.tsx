import { getGovernanceHomeModel } from "@/lib/governance/home-config";
import { getDepartmentGovernanceHomeContext } from "@/lib/governance/home/load-home-context";
import { GovernanceHomeCenter } from "./GovernanceHomeCenter";

type DepartmentDashboardPageProps = {
  departmentKey: string;
};

export async function DepartmentDashboardPage({ departmentKey }: DepartmentDashboardPageProps) {
  const context = await getDepartmentGovernanceHomeContext(departmentKey);
  const model = getGovernanceHomeModel({
    roleKey: context.roleKey,
    departmentKey: context.departmentKey,
    supervisionScope: context.supervisionScope,
  });

  return <GovernanceHomeCenter model={model} userDisplayName={context.userDisplayName} />;
}
