/**
 * AUTHORIZATION CORE — source unique runtime (Phase 2).
 * Hiérarchie : system_authority → department → business role → permissions → routes → actions.
 */
import { canAccessPathForProfile, hasAdminConsoleAccess } from "@/lib/auth/permissions";
import {
  isAdminUtilityPath,
  isAuthenticatedUtilityPath,
  isLayoutGuardedPath,
} from "@/lib/auth/route-utility-paths";
import {
  hasSystemRootAuthority,
  isRootAuthority,
  normalizeSystemAuthority,
  resolveEffectivePlatformRoleKey,
  SYSTEM_AUTHORITY,
  type SystemAuthority,
  type SystemAuthoritySlice,
} from "@/lib/auth/system-authority";
import { normalizeRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import {
  resolvePostLoginRoute,
  resolveSafeHomeRoute,
} from "@/lib/navigation/home-route";
import type { ProfileAuthBrief } from "@/lib/server/permissions";

export {
  SYSTEM_AUTHORITY,
  normalizeSystemAuthority,
  type SystemAuthority,
  type SystemAuthoritySlice,
};

/** Profil plateforme unifié — toutes les décisions runtime passent par cette forme. */
export type PlatformAuthorityProfile = {
  roleKey: string | null;
  systemAuthority: string | null;
  departmentKey: string | null;
};

export type AuthorityScope = {
  systemAuthority: SystemAuthority;
  effectiveRoleKey: string;
  isPlatformRoot: boolean;
  isAdminConsole: boolean;
  departmentKey: string | null;
};

export {
  AUTHENTICATED_UTILITY_PREFIXES,
  ADMIN_UTILITY_PREFIXES,
  LAYOUT_GUARDED_PREFIXES,
  isAuthenticatedUtilityPath,
  isAdminUtilityPath,
  isLayoutGuardedPath,
} from "@/lib/auth/route-utility-paths";

export function toPlatformAuthorityProfile(
  input: SystemAuthoritySlice & { departmentKey?: string | null },
): PlatformAuthorityProfile {
  return {
    roleKey: input.roleKey ?? null,
    systemAuthority: input.systemAuthority ?? null,
    departmentKey: input.departmentKey ?? null,
  };
}

export function fromAuthBrief(brief: ProfileAuthBrief): PlatformAuthorityProfile {
  return {
    roleKey: brief.roleKey,
    systemAuthority: brief.systemAuthority,
    departmentKey: brief.departmentKey,
  };
}

/** Alias explicite — autorité plateforme (ROOT / SUPER_ADMIN + compat role_key). */
export function hasSystemAuthority(slice: SystemAuthoritySlice): boolean {
  return hasSystemRootAuthority(slice);
}

/** Autorité ROOT stricte (colonne system_authority = ROOT). */
export function hasRootAuthority(slice: SystemAuthoritySlice): boolean {
  if (isRootAuthority(slice.systemAuthority)) return true;
  return false;
}

export function resolveAuthorityScope(profile: PlatformAuthorityProfile): AuthorityScope {
  const systemAuthority = normalizeSystemAuthority(profile.systemAuthority);
  const isPlatformRoot = hasSystemRootAuthority(profile);
  const effectiveRoleKey = resolveEffectivePlatformRoleKey(
    profile.roleKey,
    profile.systemAuthority,
  );
  return {
    systemAuthority,
    effectiveRoleKey,
    isPlatformRoot,
    isAdminConsole: hasAdminConsoleAccess(
      profile.roleKey,
      profile.departmentKey,
      profile.systemAuthority,
    ),
    departmentKey: profile.departmentKey,
  };
}

/**
 * Accès route unifié — toujours passer system_authority.
 */
export function canAccessRoute(
  pathname: string,
  profile: PlatformAuthorityProfile,
): boolean {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (isAuthenticatedUtilityPath(path)) return true;

  if (isLayoutGuardedPath(path)) return true;

  if (isAdminUtilityPath(path)) {
    return hasAdminConsoleAccess(
      profile.roleKey,
      profile.departmentKey,
      profile.systemAuthority,
    );
  }

  return canAccessPathForProfile(
    path,
    profile.roleKey,
    profile.departmentKey,
    profile.systemAuthority,
  );
}

export type PlatformAction =
  | "user.admin.update"
  | "user.role.update"
  | "user.deactivate"
  | "approval.decide"
  | "finance.expense.mutate"
  | "vente.operational.mutate";

/** Garde actions sensibles — étendu Phase 5 (matrix engine). */
export function canExecuteAction(
  action: PlatformAction,
  profile: PlatformAuthorityProfile,
): boolean {
  const scope = resolveAuthorityScope(profile);

  switch (action) {
    case "user.admin.update":
    case "user.role.update":
    case "user.deactivate":
      return scope.isPlatformRoot;
    case "approval.decide":
      return scope.isPlatformRoot || scope.isAdminConsole;
    case "finance.expense.mutate":
    case "vente.operational.mutate":
      return !scope.isPlatformRoot && normalizeRoleKey(profile.roleKey) !== ROLE_KEYS.SUPER_ADMIN;
    default:
      return false;
  }
}

/** Destination canonique après authentification — unique point d’entrée redirects. */
export function resolveAuthenticatedLanding(profile: PlatformAuthorityProfile): string {
  return resolvePostLoginRoute(
    profile.roleKey,
    profile.departmentKey,
    profile.systemAuthority,
  );
}

export function resolveAuthenticatedSafeHome(profile: PlatformAuthorityProfile): string {
  return resolveSafeHomeRoute(
    profile.roleKey,
    profile.departmentKey,
    profile.systemAuthority,
  );
}

/** Rôle effectif exposé au shell / notifications (promotion SA si autorité système). */
export function resolveNavigationRoleKey(profile: PlatformAuthorityProfile): string {
  return resolveEffectivePlatformRoleKey(profile.roleKey, profile.systemAuthority);
}

export function isPlatformGovernanceActor(profile: PlatformAuthorityProfile): boolean {
  return hasSystemAuthority(profile);
}
