/**
 * Routes Accueil / post-login — alignement M3 (super_admin global, métiers = cockpit dept).
 */
import {
  DEPARTMENT_KEYS,
  getDepartmentNavigationEntry,
} from "@/lib/departments/department-config";
import { resolveAuthorityDepartmentKey } from "@/lib/auth/profile-authority";
import { SUPER_ADMIN_COCKPIT_ROUTE } from "@/lib/navigation/erp-ux-architecture";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";

export { resolveEffectiveDepartmentKey } from "@/lib/auth/profile-authority";

/** Destination canonique après authentification. */
export function resolvePostLoginRoute(
  roleKey: string | null | undefined,
  departmentKey?: string | null | undefined,
): string {
  const r = effectiveAuthRoleKey(roleKey);
  const effectiveDept = resolveAuthorityDepartmentKey(roleKey, departmentKey);

  if (r === ROLE_KEYS.SUPER_ADMIN) {
    // Super Admin atterrit directement sur son département de supervision
    // pour accéder immédiatement aux onglets/boutons administration.
    return "/admin";
  }

  if (r === ROLE_KEYS.ACCOUNTANT) {
    return (
      getDepartmentNavigationEntry(DEPARTMENT_KEYS.FINANCE)?.dashboardRoute ?? "/dept/finance"
    );
  }

  if (r === ROLE_KEYS.AUDITOR) {
    return (
      getDepartmentNavigationEntry(DEPARTMENT_KEYS.AUDIT)?.dashboardRoute ?? "/admin/activity-logs"
    );
  }

  const nav = effectiveDept ? getDepartmentNavigationEntry(effectiveDept) : null;

  if (r === ROLE_KEYS.MANAGER) {
    if (effectiveDept === DEPARTMENT_KEYS.ADMINISTRATION) {
      return "/actions";
    }
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
