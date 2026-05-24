/**
 * Route authority — Bloc 1 Étape 4 (isolation sans rebuild middleware).
 * Consomme profile-authority ; source unique pour middleware edge et guards app.
 */
import {
  getDepartmentRoutePrefixes,
} from "@/lib/departments/department-config";
import { resolveAuthorityDepartmentKey } from "@/lib/auth/profile-authority";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import {
  canProfileAccessDeptPath,
} from "@/lib/navigation/dept-cockpit-route";

export const ROUTE_AUTHORITY_VERSION = "route-isolation-v1" as const;

const UNIVERSAL_SHELL_PREFIXES = [
  "/dashboard",
  "/settings",
  "/access-denied",
  "/error-profile",
  "/auth/set-password",
] as const;

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const base = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

function pathnameMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function pathnameMatchesAnyPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathnameMatchesPrefix(pathname, p));
}

function isUniversalShellPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return UNIVERSAL_SHELL_PREFIXES.some((p) => pathnameMatchesPrefix(path, p));
}

/**
 * Préfixes opérationnels gouvernés — département effectif (profil + legacy explicite).
 */
export function resolveAuthorityRoutePrefixes(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): readonly string[] {
  const authorityDept = resolveAuthorityDepartmentKey(roleKey, departmentKey);
  return getDepartmentRoutePrefixes(authorityDept);
}

/**
 * /dept/[slug] — délègue au lock strict dept-cockpit-route.
 */
export function canAccessDeptCockpitPathForProfile(
  pathname: string,
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  return canProfileAccessDeptPath(pathname, roleKey, departmentKey);
}

/** Département effectif pour garde-fous console admin (DG legacy inclus). */
export function resolveAdminConsoleDepartmentKey(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): string | null {
  return resolveAuthorityDepartmentKey(roleKey, departmentKey);
}

export type RouteAccessSlice = {
  authorityDepartmentKey: ReturnType<typeof resolveAuthorityDepartmentKey>;
  canonicalRoleKey: ReturnType<typeof effectiveAuthRoleKey>;
  operationalPrefixes: readonly string[];
};

/** Slice autorité route — calcul pur, réutilisable middleware / tests. */
export function buildRouteAccessSlice(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): RouteAccessSlice {
  const authorityDepartmentKey = resolveAuthorityDepartmentKey(roleKey, departmentKey);
  return {
    authorityDepartmentKey,
    canonicalRoleKey: effectiveAuthRoleKey(roleKey),
    operationalPrefixes: getDepartmentRoutePrefixes(authorityDepartmentKey),
  };
}

/**
 * Accès opérationnel département (hors super_admin / console admin / rôles spéciaux).
 * À combiner avec politiques SA et admin dans edge-route-guards / permissions.
 */
export function canAccessDepartmentOperationalPath(
  pathname: string,
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  const path = normalizePathname(pathname);

  if (isUniversalShellPath(path)) return true;

  if (canAccessDeptCockpitPathForProfile(pathname, roleKey, departmentKey)) {
    return true;
  }

  const slice = buildRouteAccessSlice(roleKey, departmentKey);
  const { canonicalRoleKey: r, operationalPrefixes } = slice;

  if (r === ROLE_KEYS.ACCOUNTANT) {
    return pathnameMatchesAnyPrefix(path, ["/finance"]);
  }

  if (r === ROLE_KEYS.AUDITOR) {
    return pathnameMatchesAnyPrefix(path, ["/admin/activity-logs"]);
  }

  if (operationalPrefixes.length > 0 && pathnameMatchesAnyPrefix(path, operationalPrefixes)) {
    return true;
  }

  return false;
}

/** RH manager/agent — département RH requis pour préfixes /rh. */
export function isRhOperationalPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return path === "/rh" || path.startsWith("/rh/");
}
