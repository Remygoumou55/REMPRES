/**
 * Rôles génériques ERP — source unique (pas de département dans le nom du rôle).
 */
export const ROLE_KEYS = {
  SUPER_ADMIN: "super_admin",
  MANAGER: "manager",
  AGENT: "agent",
  AUDITOR: "auditor",
  ACCOUNTANT: "accountant",
} as const;

export type AppRoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

/** Alias DB courants / compat lecture — département : `LEGACY_ROLE_TO_DEPARTMENT` (profile-authority). */
export const LEGACY_ROLE_ALIASES: Record<string, AppRoleKey> = {
  superadmin: ROLE_KEYS.SUPER_ADMIN,
  "super-admin": ROLE_KEYS.SUPER_ADMIN,
  employe: ROLE_KEYS.AGENT,
  directeur_general: ROLE_KEYS.MANAGER,
  responsable_vente: ROLE_KEYS.MANAGER,
  responsable_rh: ROLE_KEYS.MANAGER,
  responsable_formation: ROLE_KEYS.MANAGER,
  responsable_consultation: ROLE_KEYS.MANAGER,
  responsable_marketing: ROLE_KEYS.MANAGER,
  responsable_logistique: ROLE_KEYS.MANAGER,
  comptable: ROLE_KEYS.ACCOUNTANT,
  auditeur: ROLE_KEYS.AUDITOR,
};

export const ROLE_OPTIONS_UI: readonly { key: AppRoleKey; label: string }[] = [
  { key: ROLE_KEYS.SUPER_ADMIN, label: "Super administrateur" },
  { key: ROLE_KEYS.MANAGER, label: "Manager" },
  { key: ROLE_KEYS.AGENT, label: "Agent" },
  { key: ROLE_KEYS.AUDITOR, label: "Auditeur" },
  { key: ROLE_KEYS.ACCOUNTANT, label: "Comptable" },
] as const;

/** Rôles assignables via formulaires admin (hors super_admin). */
export const ASSIGNABLE_ROLE_OPTIONS_UI: readonly { key: AppRoleKey; label: string }[] =
  ROLE_OPTIONS_UI.filter((r) => r.key !== ROLE_KEYS.SUPER_ADMIN);

export function normalizeRoleKey(roleKey: string | null | undefined): string {
  return String(roleKey ?? "").trim().toLowerCase();
}

export function isKnownGenericRoleKey(roleKey: string | null | undefined): roleKey is AppRoleKey {
  const k = normalizeRoleKey(roleKey);
  return (Object.values(ROLE_KEYS) as string[]).includes(k);
}

export function resolveRoleKey(roleKey: string | null | undefined): AppRoleKey | null {
  const k = normalizeRoleKey(roleKey);
  if ((Object.values(ROLE_KEYS) as string[]).includes(k)) {
    return k as AppRoleKey;
  }
  const mapped = LEGACY_ROLE_ALIASES[k];
  return mapped ?? null;
}

/** Rôle générique pour redirections et garde-fous (aliases résolus + clés canoniques seules). */
export function effectiveAuthRoleKey(roleKey: string | null | undefined): AppRoleKey | "" {
  const resolved = resolveRoleKey(roleKey);
  if (resolved) return resolved;
  const k = normalizeRoleKey(roleKey);
  return (Object.values(ROLE_KEYS) as string[]).includes(k) ? (k as AppRoleKey) : "";
}

/** Vrai si le profil DB est super administrateur (comparaison normalisée). */
export function isSuperAdminRoleKey(roleKey: string | null | undefined): boolean {
  const k = normalizeRoleKey(roleKey);
  if (k === ROLE_KEYS.SUPER_ADMIN) return true;
  if (LEGACY_ROLE_ALIASES[k] === ROLE_KEYS.SUPER_ADMIN) return true;
  return k.replace(/[\s_-]+/g, "") === "superadmin";
}
