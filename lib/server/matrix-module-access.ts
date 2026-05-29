/**
 * Module access bridge — Phase 5 matrix engine pour *-access.ts legacy.
 */
import { redirect } from "next/navigation";
import { normalizeRoleKey } from "@/lib/auth/roles";
import {
  matrixCanExecuteAction,
  type PlatformAuthorityProfile,
} from "@/lib/auth/authorization-matrix-engine";
import { hasSystemRootAuthority } from "@/lib/auth/system-authority";
import type { ProfileAuthBrief } from "@/lib/server/permissions";
import {
  getModulePermissions,
  getProfileAuthBrief,
  type ModulePermissions,
} from "@/lib/server/permissions";

export type MatrixModuleAccessOptions = {
  /** Compat rôles historiques (ex. responsable_rh) en attendant migration permissions. */
  legacyRoleKeys?: readonly string[];
};

function briefToProfile(brief: ProfileAuthBrief): PlatformAuthorityProfile {
  return {
    roleKey: brief.roleKey,
    systemAuthority: brief.systemAuthority,
    departmentKey: brief.departmentKey,
  };
}

function hasLegacyRoleAccess(roleKey: string | null, legacyRoleKeys?: readonly string[]): boolean {
  if (!legacyRoleKeys?.length || !roleKey) return false;
  const normalized = normalizeRoleKey(roleKey);
  return legacyRoleKeys.some((r) => normalizeRoleKey(r) === normalized);
}

async function loadProfileOrDeny(userId: string) {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok || !brief.roleKey) {
    redirect("/access-denied");
  }
  return { brief, profile: briefToProfile(brief) };
}

/** Lecture module — control plane autorisé (supervision), sinon permissions table. */
export async function assertMatrixModuleRead(
  userId: string,
  moduleKey: string,
  options?: MatrixModuleAccessOptions,
): Promise<void> {
  const { brief, profile } = await loadProfileOrDeny(userId);
  if (hasSystemRootAuthority(profile)) return;
  if (hasLegacyRoleAccess(brief.roleKey, options?.legacyRoleKeys)) return;

  const perms = await getModulePermissions(userId, [moduleKey]);
  if (
    matrixCanExecuteAction("module.read", profile, {
      moduleKey,
      modulePermissions: perms,
    })
  ) {
    return;
  }
  redirect("/access-denied");
}

/** Écriture module — refus control plane ; permissions ou rôles legacy. */
export async function assertMatrixModuleWrite(
  userId: string,
  moduleKey: string,
  options?: MatrixModuleAccessOptions,
): Promise<void> {
  const { brief, profile } = await loadProfileOrDeny(userId);
  if (hasSystemRootAuthority(profile)) {
    redirect("/access-denied");
  }
  if (hasLegacyRoleAccess(brief.roleKey, options?.legacyRoleKeys)) return;

  const perms = await getModulePermissions(userId, [moduleKey]);
  if (!perms.canCreate && !perms.canUpdate) {
    redirect("/access-denied");
  }
  if (
    matrixCanExecuteAction("module.write", profile, {
      moduleKey,
      modulePermissions: perms,
    })
  ) {
    return;
  }
  redirect("/access-denied");
}

export async function matrixModuleCanDelete(
  userId: string,
  moduleKey: string,
  options?: MatrixModuleAccessOptions,
): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok || !brief.roleKey) return false;
  const profile = briefToProfile(brief);
  if (hasSystemRootAuthority(profile)) return false;
  if (hasLegacyRoleAccess(brief.roleKey, options?.legacyRoleKeys)) return true;

  const perms = await getModulePermissions(userId, [moduleKey]);
  return matrixCanExecuteAction("module.delete", profile, {
    moduleKey,
    modulePermissions: perms,
  });
}

export async function matrixModulePermissions(
  userId: string,
  moduleKey: string,
): Promise<ModulePermissions> {
  return getModulePermissions(userId, [moduleKey]);
}
