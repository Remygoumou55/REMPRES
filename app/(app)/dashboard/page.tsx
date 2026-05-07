import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { DashboardClient } from "./DashboardClient";
import {
  getClientsPermissions,
  getModulePermissions,
  getProfileAuthBrief,
  isAdminRole,
} from "@/lib/server/permissions";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";
import { getGovernanceHomeModel } from "@/lib/governance/home-config";
import { GovernanceHomeCenter } from "@/components/governance/home/GovernanceHomeCenter";

export default async function DashboardPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const [permissions, productsPermissions, adminRoleFlag, kpis, userDisplayName, authBrief] =
    await Promise.all([
      getClientsPermissions(userId),
      getModulePermissions(userId, ["produits", "vente"]),
      isAdminRole(userId),
      getDashboardKpis(),
      getCachedProfileDisplayName(userId),
      getProfileAuthBrief(userId),
    ]);

  const governanceModel = getGovernanceHomeModel({
    roleKey: authBrief.roleKey,
    departmentKey: authBrief.departmentKey,
    supervisionScope: authBrief.supervisionScope,
  });

  return (
    <div className="space-y-6">
      <GovernanceHomeCenter model={governanceModel} userDisplayName={userDisplayName} />
      <DashboardClient
        userDisplayName={userDisplayName}
        canReadClients={permissions.canRead}
        canReadProducts={productsPermissions.canRead}
        canReadActivityLogs={adminRoleFlag}
        isSuperAdmin={adminRoleFlag}
        kpis={kpis}
      />
    </div>
  );
}
