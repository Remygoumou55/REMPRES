import { cache } from "react";
import { redirect } from "next/navigation";
import { hasAdminConsoleAccess } from "@/lib/auth/permissions";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import {
  resolveShellRailVisibility,
  resolveShellVisibility,
  type ShellRailVisibility,
} from "@/lib/navigation/shell-visibility";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  getClientsPermissions,
  getModulePermissions,
  getProfileAuthBrief,
} from "@/lib/server/permissions";
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
    rhPermissions,
    logisticsPermissions,
    formationPermissions,
    marketingPermissions,
    crmPermissions,
    userDisplayName,
    preferredLanguageRes,
  ] = await Promise.all([
    isSuperAdminProfile
      ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false })
      : getClientsPermissions(userId),
    isSuperAdminProfile
      ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false })
      : getModulePermissions(userId, ["produits", "vente"]),
    isSuperAdminProfile
      ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false })
      : getModulePermissions(userId, ["finance"]),
    isSuperAdminProfile
      ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false })
      : getModulePermissions(userId, ["rh"]),
    isSuperAdminProfile
      ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false })
      : getModulePermissions(userId, ["logistics"]),
    isSuperAdminProfile
      ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false })
      : getModulePermissions(userId, ["formation", "consultation"]),
    isSuperAdminProfile
      ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false })
      : getModulePermissions(userId, ["marketing"]),
    isSuperAdminProfile
      ? Promise.resolve({ canRead: false, canCreate: false, canUpdate: false, canDelete: false })
      : getModulePermissions(userId, ["crm"]),
    getCachedProfileDisplayName(userId),
    getSupabaseServerClient()
      .from("profiles")
      .select("preferred_language")
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const shellInput = {
    roleKey: authBrief.roleKey,
    departmentKey: authBrief.departmentKey,
    canReadClients: permissions.canRead,
    canReadProducts: productsPermissions.canRead,
    canReadFinance: financePermissions.canRead,
    canReadRh: rhPermissions.canRead,
    canReadLogistics: logisticsPermissions.canRead,
    canReadFormation: formationPermissions.canRead,
    canReadMarketing: marketingPermissions.canRead,
    canReadCrm: crmPermissions.canRead,
  };

  const shell = resolveShellVisibility(shellInput);
  const rail: ShellRailVisibility = resolveShellRailVisibility(shellInput);

  const isSuperAdminUser =
    effectiveAuthRoleKey(authBrief.roleKey) === ROLE_KEYS.SUPER_ADMIN;

  const canReadActivityLogs =
    isSuperAdminUser ||
    hasAdminConsoleAccess(authBrief.roleKey, authBrief.departmentKey);

  return {
    userDisplayName,
    userAvatarInitial: avatarInitialFromDisplayName(userDisplayName),
    roleKey: authBrief.roleKey,
    departmentKey: authBrief.departmentKey,
    canReadClients: permissions.canRead,
    canReadProducts: productsPermissions.canRead,
    canReadFinance: financePermissions.canRead,
    canCreateFinance: financePermissions.canCreate,
    canUpdateFinance: financePermissions.canUpdate,
    canReadRh: rhPermissions.canRead,
    canReadLogistics: logisticsPermissions.canRead,
    canReadFormation: formationPermissions.canRead,
    canReadMarketing: marketingPermissions.canRead,
    canReadCrm: crmPermissions.canRead,
    canReadActivityLogs,
    isSuperAdmin: isSuperAdminUser,
    shellRail: rail,
    shell,
    preferredLanguage:
      preferredLanguageRes.data?.preferred_language != null
        ? String(preferredLanguageRes.data.preferred_language).trim().toLowerCase()
        : null,
    canArchiveClients: permissions.canRead && permissions.canDelete,
    canArchiveProduits: productsPermissions.canRead && productsPermissions.canDelete,
  };
});
