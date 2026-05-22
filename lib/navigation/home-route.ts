/**
 * Routes Accueil / post-login — alignement M3 (super_admin global, métiers = cockpit dept).
 */
import {
  DEPARTMENT_KEYS,
  getDepartmentNavigationEntry,
  normalizeDepartmentKey,
  type DepartmentKey,
} from "@/lib/departments/department-config";
import { SUPER_ADMIN_COCKPIT_ROUTE } from "@/lib/navigation/erp-ux-architecture";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";

/** Consultation absorbée → cockpit Formation (M1.5). */
export function resolveEffectiveDepartmentKey(
  departmentKey: string | null | undefined,
): DepartmentKey | null {
  const k = normalizeDepartmentKey(departmentKey);
  if (k === DEPARTMENT_KEYS.CONSULTATION) return DEPARTMENT_KEYS.FORMATION;
  const nav = getDepartmentNavigationEntry(k);
  return nav ? (k as DepartmentKey) : null;
}

/** Destination canonique après authentification. */
export function resolvePostLoginRoute(
  roleKey: string | null | undefined,
  departmentKey?: string | null | undefined,
): string {
  const r = effectiveAuthRoleKey(roleKey);
  const effectiveDept = resolveEffectiveDepartmentKey(departmentKey);

  if (r === ROLE_KEYS.SUPER_ADMIN) {
    return SUPER_ADMIN_COCKPIT_ROUTE;
  }

  if (r === ROLE_KEYS.ACCOUNTANT) {
    return (
      getDepartmentNavigationEntry(DEPARTMENT_KEYS.FINANCE)?.dashboardRoute ?? "/finance/dashboard"
    );
  }

  if (r === ROLE_KEYS.AUDITOR) {
    return (
      getDepartmentNavigationEntry(DEPARTMENT_KEYS.AUDIT)?.dashboardRoute ?? "/admin/activity-logs"
    );
  }

  const nav = effectiveDept ? getDepartmentNavigationEntry(effectiveDept) : null;

  if (r === ROLE_KEYS.MANAGER) {
    return nav?.dashboardRoute ?? SUPER_ADMIN_COCKPIT_ROUTE;
  }

  if (r === ROLE_KEYS.AGENT) {
    return nav?.dashboardRoute ?? nav?.operationalRootRoute ?? SUPER_ADMIN_COCKPIT_ROUTE;
  }

  return SUPER_ADMIN_COCKPIT_ROUTE;
}

/** Lien Accueil du rail métier (cockpit département). */
export function resolveDepartmentHomeRoute(
  roleKey: string | null | undefined,
  departmentKey?: string | null | undefined,
): string {
  return resolvePostLoginRoute(roleKey, departmentKey);
}
