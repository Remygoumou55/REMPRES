/**
 * Sidebar authority — Bloc 1 Étape 3 (isolation sans rebuild).
 * Consomme exclusivement profile-authority. ErpNavSidebar réservé à super_admin (gelé).
 */
import {
  buildProfileAuthoritySlice,
  resolveAuthorityDepartmentKey,
} from "@/lib/auth/profile-authority";
import { ROLE_KEYS, normalizeRoleKey } from "@/lib/auth/roles";
import type { DepartmentKey } from "@/lib/departments/department-config";

export const SIDEBAR_AUTHORITY_VERSION = "sidebar-isolation-v1" as const;

/** Seul super_admin utilise ErpNavSidebar — zone gelée, pas d’extension. */
export const ERP_GLOBAL_SIDEBAR_ROLES = [ROLE_KEYS.SUPER_ADMIN] as const;

export type SidebarRenderMode = "super_admin_erp" | "department_business";

export type SidebarAuthorityInput = {
  isSuperAdmin: boolean;
  roleKey: string;
  departmentKey: string | null | undefined;
  systemAuthority?: string | null;
};

export type SidebarAuthorityResult = {
  mode: SidebarRenderMode;
  /** Département effectif pour DepartmentBusinessSidebar (authority path) */
  authorityDepartmentKey: DepartmentKey | null;
  canonicalRoleKey: string;
  usesErpGlobalSidebar: boolean;
  /** Tous les rôles non-SA passent par department_business + shellRail lock */
  visibilityLock: "locked";
};

/**
 * Résolution sidebar gouvernée — une entrée, pas de truth parallèle.
 * directeur_general → ADMINISTRATION via profile-authority (legacy gouverné).
 */
export function resolveSidebarAuthority(input: SidebarAuthorityInput): SidebarAuthorityResult {
  if (input.isSuperAdmin) {
    return {
      mode: "super_admin_erp",
      authorityDepartmentKey: null,
      canonicalRoleKey: ROLE_KEYS.SUPER_ADMIN,
      usesErpGlobalSidebar: true,
      visibilityLock: "locked",
    };
  }

  const rawRole = normalizeRoleKey(input.roleKey);
  const slice = buildProfileAuthoritySlice(
    input.roleKey,
    input.departmentKey,
    input.systemAuthority,
  );

  if (rawRole === ROLE_KEYS.SUPER_ADMIN) {
    return {
      mode: "super_admin_erp",
      authorityDepartmentKey: null,
      canonicalRoleKey: ROLE_KEYS.SUPER_ADMIN,
      usesErpGlobalSidebar: true,
      visibilityLock: "locked",
    };
  }

  const authorityDepartmentKey = resolveAuthorityDepartmentKey(
    input.roleKey,
    input.departmentKey,
    input.systemAuthority,
  );

  return {
    mode: "department_business",
    authorityDepartmentKey,
    canonicalRoleKey: slice.canonicalRoleKey || rawRole,
    usesErpGlobalSidebar: false,
    visibilityLock: "locked",
  };
}

export function usesErpGlobalSidebarFromAuthority(result: SidebarAuthorityResult): boolean {
  return result.usesErpGlobalSidebar;
}
