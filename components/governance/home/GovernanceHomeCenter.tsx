import type { GovernanceHomeModel } from "@/lib/governance/home-config";
import { WelcomeCard } from "./WelcomeCard";
import { RoleMissionCard } from "./RoleMissionCard";
import { DepartmentOverviewCard } from "./DepartmentOverviewCard";
import { AllowedActionsCard } from "./AllowedActionsCard";
import { RestrictedActionsCard } from "./RestrictedActionsCard";
import { GovernanceRulesCard } from "./GovernanceRulesCard";
import { BestPracticesCard } from "./BestPracticesCard";
import { SecurityNoticeCard } from "./SecurityNoticeCard";

type GovernanceHomeCenterProps = {
  model: GovernanceHomeModel;
  userDisplayName: string;
};

export function GovernanceHomeCenter({ model, userDisplayName }: GovernanceHomeCenterProps) {
  const hasSupervisionNotes = Boolean(model.supervisionNotes && model.supervisionNotes.length > 0);

  return (
    <div className="space-y-4">
      <WelcomeCard title={model.title} subtitle={model.subtitle} userDisplayName={userDisplayName} />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RoleMissionCard mission={model.roleMission} />
        <DepartmentOverviewCard overview={model.departmentOverview} />
        <AllowedActionsCard items={model.allowedActions} />
        <RestrictedActionsCard items={model.restrictedActions} />
        <GovernanceRulesCard items={model.governanceRules} />
        <BestPracticesCard items={model.bestPractices} />
        <SecurityNoticeCard items={model.securityNotices} />
        {hasSupervisionNotes ? (
          <GovernanceRulesCard items={model.supervisionNotes ?? []} />
        ) : null}
      </div>
    </div>
  );
}
