/**
 * Politiques d'autorisation métier centralisées (validation invite, console admin, restrictions super_admin).
 */
import {
  DEPARTMENT_KEYS,
  normalizeDepartmentKey,
  type DepartmentKey,
} from "@/lib/departments/department-config";
import { effectiveAuthRoleKey, resolveRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import {
  isSuperAdminGovernancePath,
  isSuperAdminOperationalPath,
  isSuperAdminReadOnlyVentePath,
} from "@/lib/auth/supervision";
import {
  canAccessDepartmentOperationalPath,
  canAccessDeptCockpitPathForProfile,
  resolveAdminConsoleDepartmentKey,
} from "@/lib/navigation/route-authority";

export type RoleDepartmentValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export type SupervisionScope = "global" | "departmental" | "restricted";

function normalizePathname(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function pathnameMatchesAnyPrefix(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

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

/** Accès aux routes /console admin Next (équivalent ancien DG + super_admin). */
export function hasAdminConsoleAccess(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  const r = effectiveAuthRoleKey(roleKey);
  if (r === ROLE_KEYS.SUPER_ADMIN) return true;
  const adminDept = resolveAdminConsoleDepartmentKey(roleKey, departmentKey);
  if (r === ROLE_KEYS.MANAGER && normalizeDepartmentKey(adminDept) === DEPARTMENT_KEYS.ADMINISTRATION) {
    return true;
  }
  return false;
}

/** Portée de supervision dérivée du profil (JWT délégué au profil DB — calcul serveur). */
export function getSupervisionScope(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): SupervisionScope {
  const r = effectiveAuthRoleKey(roleKey);
  if (!r) return "restricted";
  if (r === ROLE_KEYS.SUPER_ADMIN) return "global";
  if (hasAdminConsoleAccess(roleKey, departmentKey)) return "global";
  if (isSupervisionOnlyDepartmentKey(departmentKey)) return "restricted";
  return "departmental";
}

/**
 * Accès à une URL pour un profil donné (middleware + futurs guards centralisés).
 * Pas de logique « responsable_* » — uniquement rôle générique + département + politiques globales.
 */
export function canAccessPathForProfile(
  pathname: string,
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  const path = normalizePathname(pathname);

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

  if (canAccessDeptCockpitPathForProfile(pathname, roleKey, departmentKey)) {
    return true;
  }

  const r = effectiveAuthRoleKey(roleKey);

  if (r === ROLE_KEYS.SUPER_ADMIN) {
    if (isSuperAdminOperationalPath(path)) return false;
    if (isSuperAdminGovernancePath(path)) return true;
    if (isSuperAdminReadOnlyVentePath(path)) return true;
    return false;
  }

  const adminDept = resolveAdminConsoleDepartmentKey(roleKey, departmentKey);
  if (hasAdminConsoleAccess(roleKey, adminDept)) {
    return pathnameMatchesAnyPrefix(path, ADMIN_CONSOLE_ALLOWED_PREFIXES);
  }

  return canAccessDepartmentOperationalPath(pathname, roleKey, departmentKey);
}

/** Alias explicite — même implémentation que `canAccessPathForProfile`. */
export function canAccessDepartment(
  pathname: string,
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  return canAccessPathForProfile(pathname, roleKey, departmentKey);
}

/** Alias explicite — même implémentation que `canAccessPathForProfile`. */
export function canAccessOperationalModule(
  pathname: string,
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  return canAccessPathForProfile(pathname, roleKey, departmentKey);
}

/** Département « supervision-only » (ERP métier — pas d’opérations vente/clients/produits directes). */
export function isSupervisionOnlyDepartmentKey(
  departmentKey: string | null | undefined,
): boolean {
  const k = normalizeDepartmentKey(departmentKey);
  return k === DEPARTMENT_KEYS.ADMINISTRATION;
}

/**
 * Super-admin : pilotage global uniquement — pas de données opérationnelles commerciales.
 */
export function isSuperAdminOperationalBlocked(roleKey: string | null | undefined): boolean {
  return effectiveAuthRoleKey(roleKey) === ROLE_KEYS.SUPER_ADMIN;
}

export function validateInviteRoleDepartment(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): RoleDepartmentValidationResult {
  const r = resolveRoleKey(roleKey);
  const dk = normalizeDepartmentKey(departmentKey);

  if (!r) {
    return { ok: false, error: "Rôle invalide." };
  }

  if (r === ROLE_KEYS.SUPER_ADMIN) {
    if (dk !== "") {
      return {
        ok: false,
        error: "Un super administrateur ne doit pas être rattaché à un département.",
      };
    }
    return { ok: true };
  }

  if (r === ROLE_KEYS.ACCOUNTANT) {
    if (dk !== DEPARTMENT_KEYS.FINANCE) {
      return {
        ok: false,
        error: "Le comptable doit être affecté au département Finance.",
      };
    }
    return { ok: true };
  }

  if (r === ROLE_KEYS.AUDITOR) {
    if (dk !== "" && dk !== DEPARTMENT_KEYS.AUDIT) {
      return {
        ok: false,
        error: "L’auditeur doit être affecté au département Audit interne (ou sans département).",
      };
    }
    return { ok: true };
  }

  if ((r === ROLE_KEYS.MANAGER || r === ROLE_KEYS.AGENT) && !dk) {
    return { ok: false, error: "Ce rôle nécessite un département." };
  }

  return { ok: true };
}

/** Pour extensions futures (workflows, notifications). */
export function canManageDepartment(
  actorRoleKey: string | null | undefined,
  actorDepartmentKey: string | null | undefined,
  targetDepartmentKey: DepartmentKey,
): boolean {
  if (effectiveAuthRoleKey(actorRoleKey) === ROLE_KEYS.SUPER_ADMIN) return true;
  if (hasAdminConsoleAccess(actorRoleKey, actorDepartmentKey)) return true;
  const actorDept = normalizeDepartmentKey(actorDepartmentKey);
  return actorDept === normalizeDepartmentKey(targetDepartmentKey);
}

export function canViewAnalytics(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): boolean {
  const r = effectiveAuthRoleKey(roleKey);
  if (r === ROLE_KEYS.SUPER_ADMIN) return true;
  if (hasAdminConsoleAccess(roleKey, departmentKey)) return true;
  if (r === ROLE_KEYS.MANAGER || r === ROLE_KEYS.ACCOUNTANT || r === ROLE_KEYS.AUDITOR) return true;
  return false;
}
