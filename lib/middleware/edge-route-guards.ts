/**
 * Garde-fous pathname-only pour le middleware Edge — sans lucide, nav-config ni Database types.
 * Logique alignée sur legacy-route-lock, supervision et governance-nav (pathname, search=null).
 */

import {
  DEPARTMENT_KEYS,
  getDepartmentRoutePrefixes,
  normalizeDepartmentKey,
} from "@/lib/departments/department-config";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import {
  SETTINGS_LEGACY_ALIAS_REDIRECTS,
  SETTINGS_OFFICIAL_ROUTES,
  isSettingsOfficialPath,
} from "@/lib/settings/official-routes";

const ROUTES_ARCHIVES = "/archives";
const ROUTES_ACTIONS = "/actions";
const ROUTES_HISTORY = "/vente/historique";

const ADMIN_GOVERNANCE_ALLOWED_EXACT = new Set([
  "/admin/platform-dashboard",
  "/admin/intelligence",
  "/admin/global-dashboard",
]);

const ADMIN_GOVERNANCE_ALLOWED_PREFIXES = [
  "/admin/approvals",
  "/admin/alerts",
  "/admin/audit",
  "/admin/activity-logs",
  "/admin/archives",
] as const;

const SUPER_ADMIN_GOVERNANCE_ALLOWED_PREFIXES = [
  "/dashboard",
  "/dept",
  "/actions",
  "/archives",
  "/settings",
  "/access-denied",
  "/error-profile",
  "/auth/set-password",
] as const;

const SUPER_ADMIN_READ_ONLY_VENTE_PREFIXES = [
  "/vente/clients/archives",
  "/vente/produits/archives",
  "/vente/historique",
  "/vente/recu",
] as const;

const SUPER_ADMIN_OPERATIONAL_BLOCKED_PREFIXES = [
  "/vente",
  "/finance",
  "/rh",
  "/formation",
  "/consultation",
  "/marketing",
  "/logistique",
] as const;

const ADMIN_CONSOLE_ALLOWED_PREFIXES = [
  "/settings",
  "/dashboard",
  "/dept",
  "/actions",
  "/archives",
  "/admin/approvals",
  "/admin/alerts",
  "/admin/audit",
  "/admin/activity-logs",
  "/admin/platform-dashboard",
  "/admin/intelligence",
  "/admin/global-dashboard",
  "/admin/archives",
  "/admin/exports",
  "/admin/suppressions",
] as const;

function normalize(pathname: string): string {
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

function isLegacySettingsAliasPath(pathname: string): boolean {
  if (pathname in SETTINGS_LEGACY_ALIAS_REDIRECTS) return true;
  if (pathname.startsWith("/config/")) return true;
  if (pathname === "/admin/users" || pathname.startsWith("/admin/users/")) return true;
  if (pathname === "/admin/currency" || pathname.startsWith("/admin/currency/")) return true;
  return false;
}

/** Aligné sur governance-nav — sans query string (middleware). */
export function edgeIsGovernanceActionsPath(pathname: string): boolean {
  const path = normalize(pathname);
  if (isSettingsOfficialPath(path) || isLegacySettingsAliasPath(path)) return false;
  if (path.startsWith("/admin/activity-logs/export")) return false;
  if (path === ROUTES_ACTIONS || path.startsWith(`${ROUTES_ACTIONS}/`)) return true;
  if (path.startsWith("/admin/approvals")) return true;
  if (path.startsWith("/admin/alerts")) return true;
  if (path.startsWith("/admin/audit")) return true;
  if (path === "/actions/journaux" || path.startsWith("/actions/journaux/")) return true;
  if (path === "/admin/platform-dashboard") return true;
  if (path === "/admin/intelligence" || path.startsWith("/admin/intelligence/")) return true;
  return false;
}

/** Aligné sur archives governance-nav — search=null en middleware. */
export function edgeIsArchivesGovernancePath(pathname: string): boolean {
  const path = normalize(pathname);
  if (path === ROUTES_ARCHIVES || path.startsWith(`${ROUTES_ARCHIVES}/`)) return true;
  if (path.startsWith("/admin/archives")) return true;
  if (path.startsWith("/vente/clients/archives")) return true;
  if (path.startsWith("/vente/produits/archives")) return true;
  if (path === ROUTES_HISTORY || path.startsWith(`${ROUTES_HISTORY}/`)) return true;
  if (path === "/vente/recu" || path.startsWith("/vente/recu/")) return true;
  if (path.startsWith("/admin/activity-logs/export")) return true;
  return false;
}

export function edgeResolveSettingsLegacyAliasRedirect(pathname: string): string | null {
  const path = normalize(pathname);
  const direct = SETTINGS_LEGACY_ALIAS_REDIRECTS[path];
  if (direct) return direct;
  if (path.startsWith("/config/")) return SETTINGS_OFFICIAL_ROUTES.permissions;
  if (path.startsWith("/admin/users/")) return SETTINGS_OFFICIAL_ROUTES.users;
  return null;
}

function edgeIsAllowedAdminGovernancePath(pathname: string): boolean {
  const path = normalize(pathname);
  if (ADMIN_GOVERNANCE_ALLOWED_EXACT.has(path)) return true;
  return ADMIN_GOVERNANCE_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function edgeIsBlockedLegacyAdminPath(pathname: string): boolean {
  const path = normalize(pathname);
  if (!path.startsWith("/admin")) return false;
  if (edgeResolveSettingsLegacyAliasRedirect(path)) return false;
  if (edgeIsAllowedAdminGovernancePath(path)) return false;
  if (edgeIsGovernanceActionsPath(path)) return false;
  if (edgeIsArchivesGovernancePath(path)) return false;
  return true;
}

export function edgeResolveSettingsGovernanceRedirect(pathname: string): string | null {
  const alias = edgeResolveSettingsLegacyAliasRedirect(pathname);
  if (alias) return alias;
  if (edgeIsBlockedLegacyAdminPath(pathname)) return SETTINGS_OFFICIAL_ROUTES.hub;
  return null;
}

function edgeIsSuperAdminReadOnlyVentePath(pathname: string): boolean {
  const path = normalize(pathname);
  return SUPER_ADMIN_READ_ONLY_VENTE_PREFIXES.some((prefix) => pathnameMatchesPrefix(path, prefix));
}

function edgeIsSuperAdminOperationalPath(pathname: string): boolean {
  const path = normalize(pathname);
  if (edgeIsSuperAdminReadOnlyVentePath(path)) return false;
  if (path === "/dept" || path.startsWith("/dept/")) return false;
  return SUPER_ADMIN_OPERATIONAL_BLOCKED_PREFIXES.some((prefix) => pathnameMatchesPrefix(path, prefix));
}

function edgeIsSuperAdminGovernancePath(pathname: string): boolean {
  const path = normalize(pathname);
  if (SUPER_ADMIN_GOVERNANCE_ALLOWED_PREFIXES.some((prefix) => pathnameMatchesPrefix(path, prefix))) {
    return true;
  }
  if (isSettingsOfficialPath(path)) return true;
  if (edgeResolveSettingsLegacyAliasRedirect(path)) return true;
  if (edgeIsGovernanceActionsPath(path)) return true;
  if (edgeIsAllowedAdminGovernancePath(path)) return true;
  if (edgeIsArchivesGovernancePath(path)) return true;
  return false;
}

export function edgeHasAdminConsoleAccess(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  const r = effectiveAuthRoleKey(roleKey);
  if (r === ROLE_KEYS.SUPER_ADMIN) return true;
  if (r === ROLE_KEYS.MANAGER && normalizeDepartmentKey(departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION) {
    return true;
  }
  return false;
}

export function edgeCanAccessPathForProfile(
  pathname: string,
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  const path = normalize(pathname);

  if (
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path.startsWith("/settings") ||
    path === "/access-denied" ||
    path.startsWith("/auth/set-password") ||
    path.startsWith("/error-profile")
  ) {
    return true;
  }

  const r = effectiveAuthRoleKey(roleKey);

  if (r === ROLE_KEYS.SUPER_ADMIN) {
    if (edgeIsSuperAdminOperationalPath(path)) return false;
    if (edgeIsSuperAdminGovernancePath(path)) return true;
    if (edgeIsSuperAdminReadOnlyVentePath(path)) return true;
    return false;
  }

  if (edgeHasAdminConsoleAccess(roleKey, departmentKey)) {
    return pathnameMatchesAnyPrefix(path, ADMIN_CONSOLE_ALLOWED_PREFIXES);
  }

  if (r === ROLE_KEYS.ACCOUNTANT) {
    return pathnameMatchesAnyPrefix(path, ["/finance"]);
  }

  if (r === ROLE_KEYS.AUDITOR) {
    return pathnameMatchesAnyPrefix(path, ["/admin/activity-logs"]);
  }

  const prefixes = getDepartmentRoutePrefixes(departmentKey);
  if (prefixes.length > 0 && pathnameMatchesAnyPrefix(path, prefixes)) {
    return true;
  }

  return false;
}
