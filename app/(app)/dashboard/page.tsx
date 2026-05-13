import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { DashboardClient } from "./DashboardClient";
import {
  getClientsPermissions,
  getModulePermissions,
  getProfileAuthBrief,
  isAdminRole,
  isSuperAdmin,
} from "@/lib/server/permissions";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";
import { getGovernanceHomeModel } from "@/lib/governance/home-config";
import { GovernanceHomeCenter } from "@/components/governance/home/GovernanceHomeCenter";
import { NAV_LABELS } from "@/lib/constants/nav-labels";

export const metadata = {
  title: `${NAV_LABELS.home} — RemPres ERP`,
};

export default async function DashboardPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const [
    permissions,
    productsPermissions,
    financePermissions,
    logisticsPermissions,
    crmPermissions,
    rhPermissions,
    adminRoleFlag,
    superAdminFlag,
    kpis,
    userDisplayName,
    authBrief,
  ] = await Promise.all([
    getClientsPermissions(userId),
    getModulePermissions(userId, ["produits", "vente"]),
    getModulePermissions(userId, ["finance"]),
    getModulePermissions(userId, ["logistics"]),
    getModulePermissions(userId, ["crm", "vente"]),
    getModulePermissions(userId, ["rh"]),
    isAdminRole(userId),
    isSuperAdmin(userId),
    getDashboardKpis(),
    getCachedProfileDisplayName(userId),
    getProfileAuthBrief(userId),
  ]);

  const governanceModel = getGovernanceHomeModel({
    roleKey: authBrief.roleKey,
    departmentKey: authBrief.departmentKey,
    supervisionScope: authBrief.supervisionScope,
  });

  if (superAdminFlag) {
    return (
      <div className="page-wrapper">
        <GovernanceHomeCenter model={governanceModel} userDisplayName={userDisplayName} />
      </div>
    );
  }

  return (
    <DashboardClient
      userDisplayName={userDisplayName}
      canReadClients={permissions.canRead}
      canReadProducts={productsPermissions.canRead}
      canReadFinance={financePermissions.canRead}
      canReadLogistics={logisticsPermissions.canRead}
      canReadCrm={crmPermissions.canRead}
      canReadRh={rhPermissions.canRead}
      canReadActivityLogs={adminRoleFlag}
      isSuperAdmin={superAdminFlag}
      showExecutiveLink={superAdminFlag || adminRoleFlag}
      kpis={kpis}
    />
  );
}
