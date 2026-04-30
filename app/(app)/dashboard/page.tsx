import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { DashboardClient } from "./DashboardClient";
import { getClientsPermissions, getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";

export default async function DashboardPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const [permissions, productsPermissions, superAdminFlag, kpis, userDisplayName] =
    await Promise.all([
      getClientsPermissions(userId),
      getModulePermissions(userId, ["produits", "vente"]),
      isSuperAdmin(userId),
      getDashboardKpis(),
      getCachedProfileDisplayName(userId),
    ]);

  return (
    <DashboardClient
      userDisplayName={userDisplayName}
      canReadClients={permissions.canRead}
      canReadProducts={productsPermissions.canRead}
      canReadActivityLogs={superAdminFlag}
      isSuperAdmin={superAdminFlag}
      kpis={kpis}
    />
  );
}
