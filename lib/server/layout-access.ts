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
import { getPendingCount } from "@/lib/server/notifications";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { avatarInitialFromDisplayName } from "@/lib/server/profile-display";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const getLayoutAccess = cache(async () => {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;
  const profile = await getCachedProfileRow(userId);
  const isSuperAdminProfile = profile.roleKey === ROLE_KEYS.SUPER_ADMIN;

  const supabaseForAvatar = getSupabaseServerClient();

  const [shellPerms, pendingApprovalsCount, avatarRow] = await Promise.all([
    isSuperAdminProfile ? Promise.resolve(null) : getShellLayoutPermissions(userId),
    getPendingCount(userId, profile.roleKey).catch(() => 0),
    (async () => {
      try {
        const res = await supabaseForAvatar
          .from("profiles")
          .select("avatar_url")
          .eq("id", userId)
          .maybeSingle<{ avatar_url: string | null }>();
        return res.data ?? null;
      } catch {
        return null;
      }
    })(),
  ]);

  const userAvatarUrl =
    avatarRow?.avatar_url && avatarRow.avatar_url.trim().length > 0
      ? avatarRow.avatar_url
      : null;

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

  return {
    userDisplayName: profile.displayName,
    userAvatarInitial: avatarInitialFromDisplayName(profile.displayName),
    userAvatarUrl,
    userEmail: user.email ?? null,
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
    userId,
  };
});
