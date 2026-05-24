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
import { DEPARTMENT_KEYS, type DepartmentKey } from "@/lib/departments/department-config";
import { resolveEffectiveDepartmentKey } from "@/lib/navigation/home-route";
import { ROLE_KEYS, normalizeRoleKey } from "@/lib/auth/roles";

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

/** Rôles métier historiques (profiles DB) → département quand `department_key` est absent. */
const LEGACY_ROLE_TO_DEPARTMENT: Readonly<Record<string, DepartmentKey>> = {
  responsable_vente: DEPARTMENT_KEYS.VENTE,
  employe: DEPARTMENT_KEYS.VENTE,
  comptable: DEPARTMENT_KEYS.FINANCE,
  accountant: DEPARTMENT_KEYS.FINANCE,
  responsable_rh: DEPARTMENT_KEYS.RH,
  responsable_formation: DEPARTMENT_KEYS.FORMATION,
  responsable_consultation: DEPARTMENT_KEYS.CONSULTATION,
  responsable_marketing: DEPARTMENT_KEYS.MARKETING,
  responsable_logistique: DEPARTMENT_KEYS.LOGISTIQUE,
};

/**
 * Département effectif pour la sidebar métier (profil DB ou alias legacy).
 */
export function resolveSidebarDepartmentKey(
  roleKey: string,
  departmentKey: string | null | undefined,
): DepartmentKey | null {
  const fromProfile = resolveEffectiveDepartmentKey(departmentKey);
  if (fromProfile) return fromProfile;

  return LEGACY_ROLE_TO_DEPARTMENT[normalizeRoleKey(roleKey)] ?? null;
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
