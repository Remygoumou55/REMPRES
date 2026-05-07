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
import { getSupabaseServerClient } from "@/lib/supabaseServer";

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
    preferredLanguageRes,
  ] = await Promise.all([
    isSuperAdminProfile ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false }) : getClientsPermissions(userId),
    isSuperAdminProfile ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false }) : getModulePermissions(userId, ["produits", "vente"]),
    isSuperAdminProfile ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false }) : getModulePermissions(userId, ["finance"]),
    isAdminRole(userId),
    isSuperAdmin(userId),
    getCachedProfileDisplayName(userId),
    getSupabaseServerClient()
      .from("profiles")
      .select("preferred_language")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle(),
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
    preferredLanguage:
      preferredLanguageRes.data?.preferred_language != null
        ? String(preferredLanguageRes.data.preferred_language).trim().toLowerCase()
        : null,
    canArchiveClients: permissions.canRead && permissions.canDelete,
    canArchiveProduits: productsPermissions.canRead && productsPermissions.canDelete,
  };
});
