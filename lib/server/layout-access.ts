import { cache } from "react";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  getClientsPermissions,
  getModulePermissions,
  getProfileAuthBrief,
  isAdminRole,
  isSuperAdmin,
} from "@/lib/server/permissions";
import { ROLE_KEYS } from "@/lib/auth/roles";
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
  const authBrief = await getProfileAuthBrief(userId);
  const isSuperAdminProfile = authBrief.roleKey === ROLE_KEYS.SUPER_ADMIN;

  const [
    permissions,
    productsPermissions,
    financePermissions,
    isAdminRoleUser,
    isSuperAdminUser,
    userDisplayName,
  ] = await Promise.all([
    isSuperAdminProfile ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false }) : getClientsPermissions(userId),
    isSuperAdminProfile ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false }) : getModulePermissions(userId, ["produits", "vente"]),
    isSuperAdminProfile ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false }) : getModulePermissions(userId, ["finance"]),
    isAdminRole(userId),
    isSuperAdmin(userId),
    getCachedProfileDisplayName(userId),
  ]);

  return {
    userDisplayName,
    userAvatarInitial: avatarInitialFromDisplayName(userDisplayName),
    canReadClients: permissions.canRead,
    canReadProducts: productsPermissions.canRead,
    canReadFinance: financePermissions.canRead,
    canCreateFinance: financePermissions.canCreate,
    canUpdateFinance: financePermissions.canUpdate,
    canReadActivityLogs: isAdminRoleUser,
    isSuperAdmin: isSuperAdminUser,
    canArchiveClients: permissions.canRead && permissions.canDelete,
    canArchiveProduits: productsPermissions.canRead && productsPermissions.canDelete,
  };
});
