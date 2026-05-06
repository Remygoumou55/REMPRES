/**
 * Redirection post-login — combine rôle générique + département (pas de logique « responsable_* »).
 */
import {
  DEPARTMENT_KEYS,
  getDepartmentNavigationEntry,
  normalizeDepartmentKey,
} from "@/lib/departments/department-config";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";

/**
 * Destination après authentification selon rôle et département principal.
 * Chemins canoniques définis dans `department-config.ts` (`DEPARTMENT_NAVIGATION`).
 */
export function getPostLoginDestination(
  roleKey: string | null | undefined,
  departmentKey?: string | null,
): string {
  const r = effectiveAuthRoleKey(roleKey);
  const dk = normalizeDepartmentKey(departmentKey);

  if (r === ROLE_KEYS.SUPER_ADMIN) {
    return "/admin/dashboard";
  }

  if (r === ROLE_KEYS.ACCOUNTANT) {
    return getDepartmentNavigationEntry(DEPARTMENT_KEYS.FINANCE)?.dashboardRoute ?? "/finance/dashboard";
  }

  if (r === ROLE_KEYS.AUDITOR) {
    return getDepartmentNavigationEntry(DEPARTMENT_KEYS.AUDIT)?.dashboardRoute ?? "/admin/activity-logs";
  }

  const nav = getDepartmentNavigationEntry(dk);

  if (r === ROLE_KEYS.MANAGER) {
    return nav?.dashboardRoute ?? "/dashboard";
  }

  if (r === ROLE_KEYS.AGENT) {
    return nav?.operationalRootRoute ?? "/dashboard";
  }

  return "/dashboard";
}

/** @deprecated Utiliser `getPostLoginDestination(role_key, department_key)`. */
export function getDestinationForRole(
  roleKey: string | null | undefined,
  departmentKey?: string | null,
): string {
  return getPostLoginDestination(roleKey, departmentKey);
}
