import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getClientsPermissions, getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";
import {
  avatarInitialFromDisplayName,
  getCachedProfileDisplayName,
} from "@/lib/server/profile-display";

export const getLayoutAccess = cache(async () => {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const [
    permissions,
    productsPermissions,
    financePermissions,
    isSuperAdminUser,
    userDisplayName,
  ] = await Promise.all([
    getClientsPermissions(userId),
    getModulePermissions(userId, ["produits", "vente"]),
    getModulePermissions(userId, ["finance"]),
    isSuperAdmin(userId),
    getCachedProfileDisplayName(userId),
  ]);

  return {
    userDisplayName,
    userAvatarInitial: avatarInitialFromDisplayName(userDisplayName),
    canReadClients: permissions.canRead,
    canReadProducts: productsPermissions.canRead,
    canReadFinance: financePermissions.canRead,
    canReadActivityLogs: isSuperAdminUser,
    isSuperAdmin: isSuperAdminUser,
    canArchiveClients: permissions.canRead && permissions.canDelete,
    canArchiveProduits: productsPermissions.canRead && productsPermissions.canDelete,
  };
});
