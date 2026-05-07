import { getGovernanceHomeModel } from "@/lib/governance/home-config";
import { getGovernanceHomeContext } from "@/lib/governance/home/load-home-context";
import { GovernanceHomeCenter } from "@/components/governance/home/GovernanceHomeCenter";

export default async function AdminDashboardPage() {
  const context = await getGovernanceHomeContext();
  const model = getGovernanceHomeModel({
    roleKey: context.roleKey,
    departmentKey: context.departmentKey,
    supervisionScope: context.supervisionScope,
  });
  return <GovernanceHomeCenter model={model} userDisplayName={context.userDisplayName} />;
}
