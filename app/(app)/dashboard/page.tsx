import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { DashboardClient } from "./DashboardClient";
import { getClientsPermissions, getModulePermissions, isAdminRole } from "@/lib/server/permissions";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";

export default async function DashboardPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const [permissions, productsPermissions, adminRoleFlag, kpis, userDisplayName] =
    await Promise.all([
      getClientsPermissions(userId),
      getModulePermissions(userId, ["produits", "vente"]),
      isAdminRole(userId),
      getDashboardKpis(),
      getCachedProfileDisplayName(userId),
    ]);

  return (
    <DashboardClient
      userDisplayName={userDisplayName}
      canReadClients={permissions.canRead}
      canReadProducts={productsPermissions.canRead}
      canReadActivityLogs={adminRoleFlag}
      isSuperAdmin={adminRoleFlag}
      kpis={kpis}
    />
  );
}
