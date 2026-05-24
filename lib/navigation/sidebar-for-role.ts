/**
 * Résolution sidebar role-first — source unique pour AppShell (hors Super Admin).
 * Pattern : role + department → mode de rendu → nav filtrée.
 */
import {
  FULL_SIDEBAR_ROLES,
  getDeptNavConfig,
  isDeptRole,
} from "@/lib/constants/dept-nav-configs";
import type { DeptNavSection } from "@/lib/constants/dept-nav-configs";
import { resolveAuthorityDepartmentKey } from "@/lib/auth/profile-authority";
import { ROLE_KEYS, normalizeRoleKey } from "@/lib/auth/roles";
import type { DepartmentKey } from "@/lib/departments/department-config";

/** Modes de rendu sidebar — Super Admin reste sur `super_admin_erp` inchangé. */
export type SidebarRenderMode =
  | "super_admin_erp"
  | "director_erp"
  | "department_business"
  | "department_legacy";

export type SidebarForRoleInput = {
  isSuperAdmin: boolean;
  roleKey: string;
  departmentKey: string | null | undefined;
};

/** Rôles métier historiques → département : voir `LEGACY_ROLE_TO_DEPARTMENT` (profile-authority). */

/**
 * Département effectif pour la sidebar métier — délègue à la source autorité verrouillée.
 */
export function resolveSidebarDepartmentKey(
  roleKey: string,
  departmentKey: string | null | undefined,
): DepartmentKey | null {
  return resolveAuthorityDepartmentKey(roleKey, departmentKey);
}

/**
 * Choisit le mode de sidebar — Super Admin et DG conservent ErpNavSidebar.
 */
export function resolveSidebarRenderMode(input: SidebarForRoleInput): SidebarRenderMode {
  if (input.isSuperAdmin) return "super_admin_erp";

  const role = normalizeRoleKey(input.roleKey);
  if (role === ROLE_KEYS.SUPER_ADMIN) return "super_admin_erp";

  if (FULL_SIDEBAR_ROLES.includes(role) && role !== ROLE_KEYS.SUPER_ADMIN) {
    return "director_erp";
  }

  if (resolveSidebarDepartmentKey(input.roleKey, input.departmentKey)) {
    return "department_business";
  }

  if (isDeptRole(input.roleKey) && getDeptNavConfig(input.roleKey)) {
    return "department_legacy";
  }

  return "department_business";
}

export type SidebarForRoleResult = {
  mode: SidebarRenderMode;
  departmentKey: DepartmentKey | null;
  legacyDeptNav: DeptNavSection[] | null;
};

/** Résolution complète pour AppShell — une entrée, pas de fallback SA. */
export function getSidebarForRole(input: SidebarForRoleInput): SidebarForRoleResult {
  const mode = resolveSidebarRenderMode(input);
  const departmentKey = resolveSidebarDepartmentKey(input.roleKey, input.departmentKey);
  const legacyDeptNav =
    mode === "department_legacy" ? getDeptNavConfig(input.roleKey) : null;

  return { mode, departmentKey, legacyDeptNav };
}

/** True si le rôle doit utiliser ErpNavSidebar (SA ou directeur général uniquement). */
export function usesErpGlobalSidebar(mode: SidebarRenderMode): boolean {
  return mode === "super_admin_erp" || mode === "director_erp";
}
