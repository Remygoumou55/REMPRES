/**
 * Platform actions — bridge matrix engine pour mutations gouvernance (users, settings).
 */
import {
  canExecuteAction,
  type PlatformAction,
} from "@/lib/auth/authorization-core";
import { getProfileAuthBrief } from "@/lib/server/permissions";

export async function canUserExecutePlatformAction(
  userId: string,
  action: PlatformAction,
): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok || !brief.roleKey) return false;
  return canExecuteAction(action, {
    roleKey: brief.roleKey,
    systemAuthority: brief.systemAuthority,
    departmentKey: brief.departmentKey,
  });
}

/** Alias gouvernance utilisateurs — remplace isSuperAdmin pour mutations profiles. */
export async function canManagePlatformUsers(userId: string): Promise<boolean> {
  return canUserExecutePlatformAction(userId, "user.admin.update");
}
