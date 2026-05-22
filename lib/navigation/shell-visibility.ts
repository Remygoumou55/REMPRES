/**
 * Visibilité shell ERP — alignement M2 (role_key + department_key).
 * Ne redéfinit pas la matrice RBAC : applique les règles de visibilité rail / homepage.
 */
import { hasAdminConsoleAccess } from "@/lib/auth/permissions";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import {
  DEPARTMENT_KEYS,
  DEPARTMENT_NAVIGATION,
  normalizeDepartmentKey,
  type DepartmentKey,
} from "@/lib/departments/department-config";

export type ShellModulePermissionFlags = {
  canReadClients: boolean;
  canReadProducts: boolean;
  canReadFinance: boolean;
  canReadRh: boolean;
  canReadLogistics: boolean;
  canReadFormation: boolean;
  canReadMarketing: boolean;
  canReadCrm: boolean;
};

export type ShellVisibilityInput = ShellModulePermissionFlags & {
  roleKey: string | null;
  departmentKey: string | null;
};

export type ShellRailVisibility = {
  /** Rail Commerce (POS, catalogue) — département VENTE uniquement */
  commerce: boolean;
  /** Rail CRM — sous-domaine Vente (M1.5) */
  crm: boolean;
  finance: boolean;
  rh: boolean;
  logistics: boolean;
  formation: boolean;
  marketing: boolean;
  /** Hub Actions gouvernance — super_admin ou console administration (ex-DG) */
  actions: boolean;
  /** Paramètres ERP — super_admin uniquement (phase 1.6) */
  settings: boolean;
};

export type ShellVisibility = ShellRailVisibility & {
  isSuperAdmin: boolean;
  userDepartment: DepartmentKey | null;
  /** Legacy : consultation → même exposition rail que formation (M1.5) */
  treatsConsultationAsFormation: boolean;
};

function resolveUserDepartment(departmentKey: string | null): DepartmentKey | null {
  const k = normalizeDepartmentKey(departmentKey);
  if (!k) return null;
  if (k in DEPARTMENT_NAVIGATION) return k as DepartmentKey;
  return null;
}

/** Département effectif pour le rail Formation & Consultation. */
export function isFormationDepartmentKey(departmentKey: string | null | undefined): boolean {
  const k = normalizeDepartmentKey(departmentKey);
  return k === DEPARTMENT_KEYS.FORMATION || k === DEPARTMENT_KEYS.CONSULTATION;
}

export function isVenteDepartmentKey(departmentKey: string | null | undefined): boolean {
  return normalizeDepartmentKey(departmentKey) === DEPARTMENT_KEYS.VENTE;
}

function departmentMatches(userDept: DepartmentKey | null, expected: DepartmentKey): boolean {
  return userDept === expected;
}

/**
 * Calcule la visibilité des modules du rail principal (hors super_admin).
 * Règle : department_key d'abord, puis permission module (lecture).
 */
export function resolveShellRailVisibility(input: ShellVisibilityInput): ShellRailVisibility {
  const role = effectiveAuthRoleKey(input.roleKey);
  const userDept = resolveUserDepartment(input.departmentKey);
  const isSuperAdmin = role === ROLE_KEYS.SUPER_ADMIN;

  if (isSuperAdmin) {
    return {
      commerce: false,
      crm: false,
      finance: false,
      rh: false,
      logistics: false,
      formation: false,
      marketing: false,
      actions: false,
      settings: false,
    };
  }

  const venteDept = departmentMatches(userDept, DEPARTMENT_KEYS.VENTE);
  const venteModuleRead =
    input.canReadClients || input.canReadProducts || input.canReadCrm;

  const canSeeActions = hasAdminConsoleAccess(input.roleKey, input.departmentKey);

  return {
    commerce: venteDept && (input.canReadClients || input.canReadProducts),
    crm: venteDept && venteModuleRead,
    finance:
      departmentMatches(userDept, DEPARTMENT_KEYS.FINANCE) && input.canReadFinance,
    rh: departmentMatches(userDept, DEPARTMENT_KEYS.RH) && input.canReadRh,
    logistics:
      departmentMatches(userDept, DEPARTMENT_KEYS.LOGISTIQUE) && input.canReadLogistics,
    formation: isFormationDepartmentKey(input.departmentKey) && input.canReadFormation,
    marketing:
      departmentMatches(userDept, DEPARTMENT_KEYS.MARKETING) && input.canReadMarketing,
    actions: canSeeActions,
    settings: false,
  };
}

export function resolveShellVisibility(input: ShellVisibilityInput): ShellVisibility {
  const role = effectiveAuthRoleKey(input.roleKey);
  const userDept = resolveUserDepartment(input.departmentKey);
  const isSuperAdmin = role === ROLE_KEYS.SUPER_ADMIN;
  const rail = resolveShellRailVisibility(input);

  return {
    ...rail,
    isSuperAdmin,
    userDepartment: userDept,
    treatsConsultationAsFormation: isFormationDepartmentKey(input.departmentKey),
  };
}

/** Filtre les raccourcis homepage métier — même politique que le rail. */
export function shouldShowDashboardModuleShortcut(
  module: "vente" | "crm" | "finance" | "rh" | "logistics" | "formation" | "marketing",
  visibility: ShellRailVisibility,
): boolean {
  switch (module) {
    case "vente":
      return visibility.commerce;
    case "crm":
      return visibility.crm;
    case "finance":
      return visibility.finance;
    case "rh":
      return visibility.rh;
    case "logistics":
      return visibility.logistics;
    case "formation":
      return visibility.formation;
    case "marketing":
      return visibility.marketing;
    default:
      return false;
  }
}
