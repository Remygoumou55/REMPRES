import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getClientsPermissions, getModulePermissions, isAdminRole } from "@/lib/server/permissions";
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
    isAdminRoleUser,
    userDisplayName,
  ] = await Promise.all([
    getClientsPermissions(userId),
    getModulePermissions(userId, ["produits", "vente"]),
    getModulePermissions(userId, ["finance"]),
    isAdminRole(userId),
    getCachedProfileDisplayName(userId),
  ]);

  return {
    userDisplayName,
    userAvatarInitial: avatarInitialFromDisplayName(userDisplayName),
    canReadClients: permissions.canRead,
    canReadProducts: productsPermissions.canRead,
    canReadFinance: financePermissions.canRead,
    canReadActivityLogs: isAdminRoleUser,
    isSuperAdmin: isAdminRoleUser,
    canArchiveClients: permissions.canRead && permissions.canDelete,
    canArchiveProduits: productsPermissions.canRead && productsPermissions.canDelete,
  };
});
