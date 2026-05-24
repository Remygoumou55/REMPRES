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
import { getShellLayoutPermissions } from "@/lib/server/permissions";
import { countPendingApprovals } from "@/lib/server/approvals";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { avatarInitialFromDisplayName } from "@/lib/server/profile-display";

export const getLayoutAccess = cache(async () => {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const profile = await getCachedProfileRow(userId);
  const isSuperAdminProfile = profile.roleKey === ROLE_KEYS.SUPER_ADMIN;

  const shellPerms = isSuperAdminProfile
    ? null
    : await getShellLayoutPermissions(userId);

  const permissions = shellPerms?.clients ?? {
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  };
  const productsPermissions = shellPerms?.products ?? permissions;
  const financePermissions = shellPerms?.finance ?? permissions;
  const rhPermissions = shellPerms?.rh ?? permissions;
  const logisticsPermissions = shellPerms?.logistics ?? permissions;
  const formationPermissions = shellPerms?.formation ?? permissions;
  const marketingPermissions = shellPerms?.marketing ?? permissions;
  const crmPermissions = shellPerms?.crm ?? permissions;

  const shellInput = {
    roleKey: profile.roleKey,
    departmentKey: profile.departmentKey,
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
    effectiveAuthRoleKey(profile.roleKey) === ROLE_KEYS.SUPER_ADMIN;

  const canReadActivityLogs =
    isSuperAdminUser ||
    hasAdminConsoleAccess(profile.roleKey, profile.departmentKey);

  let pendingApprovalsCount = 0;
  if (isSuperAdminUser) {
    pendingApprovalsCount = await countPendingApprovals();
  }

  return {
    userDisplayName: profile.displayName,
    userAvatarInitial: avatarInitialFromDisplayName(profile.displayName),
    roleKey: profile.roleKey,
    departmentKey: profile.departmentKey,
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
    preferredLanguage: profile.preferredLanguage,
    canArchiveClients: permissions.canRead && permissions.canDelete,
    canArchiveProduits: productsPermissions.canRead && productsPermissions.canDelete,
    pendingApprovalsCount,
  };
});
