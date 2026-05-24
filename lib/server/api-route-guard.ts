/**
 * Garde-fous API — Bloc 1 Étape 5 (hors middleware, authority-driven).
 * Les routes /api/* ne passent pas par middleware : chaque handler doit s’auto-protéger.
 */
import { ROLE_KEYS, effectiveAuthRoleKey } from "@/lib/auth/roles";
import { canAccessDeptCockpitPathForProfile } from "@/lib/navigation/route-authority";
import { canAccessPathForProfile } from "@/lib/auth/permissions";
import {
  getModulePermissions,
  getProfileAuthBrief,
  isSuperAdmin,
  type ProfileAuthBrief,
} from "@/lib/server/permissions";
import { getServerSessionUser } from "@/lib/server/auth-session";

export type ApiGuardResult =
  | { ok: true; userId: string; brief: ProfileAuthBrief }
  | { ok: false; status: 401 | 403; message: string };

/** Session API — 401 si absent. */
export async function requireApiSession(): Promise<ApiGuardResult> {
  const user = await getServerSessionUser();
  if (!user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }
  const brief = await getProfileAuthBrief(user.id);
  if (!brief.ok || !brief.roleKey) {
    return { ok: false, status: 403, message: "Forbidden" };
  }
  return { ok: true, userId: user.id, brief };
}

/**
 * GET /api/dept/[deptKey]/kpis — aligné route-authority (pas de bypass DG global).
 * Super Admin : lecture gouvernance inchangée.
 */
export async function assertApiDeptKpiAccess(
  userId: string,
  deptSlug: string,
  brief?: ProfileAuthBrief,
): Promise<ApiGuardResult> {
  const profile = brief ?? (await getProfileAuthBrief(userId));
  if (!profile.ok || !profile.roleKey) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  if (await isSuperAdmin(userId)) {
    return { ok: true, userId, brief: profile };
  }

  const cockpitPath = `/dept/${deptSlug}`;
  if (
    !canAccessDeptCockpitPathForProfile(
      cockpitPath,
      profile.roleKey,
      profile.departmentKey,
    )
  ) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  const perms = await getModulePermissions(userId, [deptSlug]);
  if (!perms.canRead) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, userId, brief: profile };
}

/** Accès module finance via route-authority + permission lecture. */
export async function assertApiFinanceModuleAccess(userId: string): Promise<ApiGuardResult> {
  const profile = await getProfileAuthBrief(userId);
  if (!profile.ok || !profile.roleKey) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  if (!canAccessPathForProfile("/finance", profile.roleKey, profile.departmentKey)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  const perms = await getModulePermissions(userId, ["finance"]);
  if (!perms.canRead) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, userId, brief: profile };
}

/** Accès RH via route-authority + permission lecture. */
export async function assertApiRhModuleAccess(userId: string): Promise<ApiGuardResult> {
  const profile = await getProfileAuthBrief(userId);
  if (!profile.ok || !profile.roleKey) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  if (effectiveAuthRoleKey(profile.roleKey) === ROLE_KEYS.SUPER_ADMIN) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  if (!canAccessPathForProfile("/rh", profile.roleKey, profile.departmentKey)) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  const perms = await getModulePermissions(userId, ["rh"]);
  if (!perms.canRead) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, userId, brief: profile };
}
