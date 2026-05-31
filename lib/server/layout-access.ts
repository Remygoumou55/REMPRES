import { cache } from "react";
import { redirect } from "next/navigation";
import { hasAdminConsoleAccess } from "@/lib/auth/permissions";
import {
  isControlPlaneActor,
  resolveShellDepartmentKey,
} from "@/lib/auth/control-plane-authority";
import { hasSystemRootAuthority } from "@/lib/auth/system-authority";
import {
  resolveShellRailVisibility,
  resolveShellVisibility,
  type ShellRailVisibility,
} from "@/lib/navigation/shell-visibility";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getShellLayoutPermissions } from "@/lib/server/permissions";
import { getPendingCount } from "@/lib/server/notifications";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { avatarInitialFromDisplayName } from "@/lib/server/profile-display";

export const getLayoutAccess = cache(async () => {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const profile = await getCachedProfileRow(userId);
  const isSuperAdminProfile = hasSystemRootAuthority({
    roleKey: profile.roleKey,
    systemAuthority: profile.systemAuthority,
  });

  const [shellPerms, pendingApprovalsCount] = await Promise.all([
    isSuperAdminProfile ? Promise.resolve(null) : getShellLayoutPermissions(userId),
    getPendingCount(userId, profile.roleKey, profile.systemAuthority).catch(() => 0),
  ]);

  const userAvatarUrl = profile.avatarUrl;

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
    systemAuthority: profile.systemAuthority,
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

  const isControlPlaneUser = isControlPlaneActor({
    roleKey: profile.roleKey,
    systemAuthority: profile.systemAuthority,
  });
  const shellDepartmentKey = resolveShellDepartmentKey(
    { roleKey: profile.roleKey, systemAuthority: profile.systemAuthority },
    profile.departmentKey,
  );

  const canReadActivityLogs =
    isControlPlaneUser ||
    hasAdminConsoleAccess(profile.roleKey, profile.departmentKey, profile.systemAuthority);

  return {
    userDisplayName: profile.displayName,
    userAvatarInitial: avatarInitialFromDisplayName(profile.displayName),
    userAvatarUrl,
    userEmail: user.email ?? null,
    roleKey: profile.roleKey,
    systemAuthority: profile.systemAuthority,
    departmentKey: profile.departmentKey,
    shellDepartmentKey,
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
    isSuperAdmin: isControlPlaneUser,
    isControlPlane: isControlPlaneUser,
    shellRail: rail,
    shell,
    preferredLanguage: profile.preferredLanguage,
    canArchiveClients: permissions.canRead && permissions.canDelete,
    canArchiveProduits: productsPermissions.canRead && productsPermissions.canDelete,
    pendingApprovalsCount,
    userId,
  };
});
