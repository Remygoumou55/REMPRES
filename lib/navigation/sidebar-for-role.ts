/**
 * Résolution sidebar role-first — délègue à sidebar-authority (Étape 3).
 * Super Admin : ErpNavSidebar inchangé. Tous les autres : DepartmentBusinessSidebar isolée.
 */
import { resolveAuthorityDepartmentKey } from "@/lib/auth/profile-authority";
import type { DepartmentKey } from "@/lib/departments/department-config";
import {
  resolveSidebarAuthority,
  usesErpGlobalSidebarFromAuthority,
  type SidebarAuthorityInput,
  type SidebarAuthorityResult,
  type SidebarRenderMode,
} from "@/lib/navigation/sidebar-authority";

export type { SidebarRenderMode, SidebarAuthorityInput, SidebarAuthorityResult };

export type SidebarForRoleInput = SidebarAuthorityInput;

export type SidebarForRoleResult = {
  mode: SidebarRenderMode;
  departmentKey: DepartmentKey | null;
};

/** @deprecated Utiliser resolveSidebarAuthority — alias compat AppShell */
export function resolveSidebarDepartmentKey(
  roleKey: string,
  departmentKey: string | null | undefined,
): DepartmentKey | null {
  return resolveAuthorityDepartmentKey(roleKey, departmentKey);
}

export function resolveSidebarRenderMode(input: SidebarForRoleInput): SidebarRenderMode {
  return resolveSidebarAuthority(input).mode;
}

/** Résolution complète pour AppShell — authority path unique, pas de legacy DeptSidebarNav. */
export function getSidebarForRole(input: SidebarForRoleInput): SidebarForRoleResult {
  const authority = resolveSidebarAuthority(input);
  return {
    mode: authority.mode,
    departmentKey: authority.authorityDepartmentKey,
  };
}

/** True uniquement pour super_admin (ErpNavSidebar gelé). */
export function usesErpGlobalSidebar(mode: SidebarRenderMode): boolean {
  return mode === "super_admin_erp";
}

export { resolveSidebarAuthority, usesErpGlobalSidebarFromAuthority };
