/**
 * ROLE SOURCE LOCK (Bloc 1 — Étape 2)
 * Source officielle unique : profiles.role_key + profiles.department_key (DB).
 * Résolution gouvernée : alias rôle (roles.ts) + département effectif (profil + legacy explicite).
 *
 * Consommateurs : sidebar-for-role, shell-visibility, home-route, dept-cockpit-route, profile-row.
 * Super Admin : branche inchangée — pas de fallback SA.
 */
import {
  DEPARTMENT_KEYS,
  getDepartmentNavigationEntry,
  normalizeDepartmentKey,
  type DepartmentKey,
} from "@/lib/departments/department-config";
import {
  effectiveAuthRoleKey,
  normalizeRoleKey,
  ROLE_KEYS,
  type AppRoleKey,
} from "@/lib/auth/roles";

export const PROFILE_AUTHORITY_VERSION = "role-source-lock-v1" as const;

/** Consultation absorbée → Formation (M1.5) ; valide clé via navigation ERP. */
export function resolveEffectiveDepartmentKey(
  departmentKey: string | null | undefined,
): DepartmentKey | null {
  const k = normalizeDepartmentKey(departmentKey);
  if (k === DEPARTMENT_KEYS.CONSULTATION) return DEPARTMENT_KEYS.FORMATION;
  const nav = getDepartmentNavigationEntry(k);
  return nav ? (k as DepartmentKey) : null;
}

/**
 * Alias legacy explicites role_key brut → département (profiles sans department_key).
 * Versionné — ne pas dupliquer ailleurs.
 */
export const LEGACY_ROLE_TO_DEPARTMENT: Readonly<Record<string, DepartmentKey>> = {
  responsable_vente: DEPARTMENT_KEYS.VENTE,
  employe: DEPARTMENT_KEYS.VENTE,
  comptable: DEPARTMENT_KEYS.FINANCE,
  accountant: DEPARTMENT_KEYS.FINANCE,
  responsable_rh: DEPARTMENT_KEYS.RH,
  responsable_formation: DEPARTMENT_KEYS.FORMATION,
  /** Legacy — consultation absorbée par le département Formation. */
  responsable_consultation: DEPARTMENT_KEYS.FORMATION,
  responsable_marketing: DEPARTMENT_KEYS.MARKETING,
  responsable_logistique: DEPARTMENT_KEYS.LOGISTIQUE,
  /** DG — périmètre Administration (sidebar isolée Étape 3, pas ERP global). */
  directeur_general: DEPARTMENT_KEYS.ADMINISTRATION,
};

export type ProfileDriftFlag =
  | "missing_role_key"
  | "missing_department_key"
  | "department_from_legacy_role_only"
  | "generic_role_without_department";

export type ProfileAuthoritySlice = {
  /** Valeur brute DB profiles.role_key */
  rawRoleKey: string | null;
  /** Valeur brute DB profiles.department_key */
  rawDepartmentKey: string | null;
  /** Rôle générique pour garde-fous (effectiveAuthRoleKey) */
  canonicalRoleKey: AppRoleKey | "";
  /** Département effectif pour sidebar, shellRail, post-login (profil puis legacy) */
  authorityDepartmentKey: DepartmentKey | null;
  driftFlags: readonly ProfileDriftFlag[];
};

function legacyDepartmentForRole(rawRoleKey: string | null): DepartmentKey | null {
  if (!rawRoleKey) return null;
  return LEGACY_ROLE_TO_DEPARTMENT[normalizeRoleKey(rawRoleKey)] ?? null;
}

/**
 * Département effectif gouverné — même vérité pour sidebar ET shellRail.
 * Priorité : department_key profil → alias legacy role_key.
 */
export function resolveAuthorityDepartmentKey(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): DepartmentKey | null {
  // Super Admin est gouvernance globale mais opère le pôle Administration
  // sans besoin d'affectation department_key explicite.
  if (normalizeRoleKey(roleKey) === ROLE_KEYS.SUPER_ADMIN) {
    return DEPARTMENT_KEYS.ADMINISTRATION;
  }

  const fromProfile = resolveEffectiveDepartmentKey(departmentKey);
  if (fromProfile) return fromProfile;

  const raw = String(roleKey ?? "").trim();
  if (!raw) return null;

  return legacyDepartmentForRole(raw);
}

/** Slice autorité — calcul pur, sans I/O. */
export function buildProfileAuthoritySlice(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): ProfileAuthoritySlice {
  const rawRoleKey = roleKey != null && String(roleKey).trim() ? String(roleKey).trim() : null;
  const rawDepartmentKey =
    departmentKey != null && String(departmentKey).trim()
      ? String(departmentKey).trim()
      : null;

  const canonicalRoleKey = effectiveAuthRoleKey(rawRoleKey);
  const authorityDepartmentKey = resolveAuthorityDepartmentKey(rawRoleKey, rawDepartmentKey);

  const driftFlags: ProfileDriftFlag[] = [];

  if (!rawRoleKey) {
    driftFlags.push("missing_role_key");
  }

  if (!rawDepartmentKey) {
    driftFlags.push("missing_department_key");
    if (authorityDepartmentKey && rawRoleKey) {
      driftFlags.push("department_from_legacy_role_only");
    }
  }

  if (
    (canonicalRoleKey === ROLE_KEYS.MANAGER || canonicalRoleKey === ROLE_KEYS.AGENT) &&
    !authorityDepartmentKey
  ) {
    driftFlags.push("generic_role_without_department");
  }

  return {
    rawRoleKey,
    rawDepartmentKey,
    canonicalRoleKey,
    authorityDepartmentKey,
    driftFlags,
  };
}

/** Super Admin exact — branche gelée, jamais dérivée d'un alias ou cookie. */
export function isSuperAdminProfileRole(roleKey: string | null | undefined): boolean {
  return normalizeRoleKey(roleKey) === ROLE_KEYS.SUPER_ADMIN;
}
