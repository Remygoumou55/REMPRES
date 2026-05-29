/**
 * Couche autorité système — indépendante des départements et rôles métiers.
 * Source DB : profiles.system_authority (+ compat profiles.role_key).
 */
import { isSuperAdminRoleKey, normalizeRoleKey, ROLE_KEYS } from "@/lib/auth/roles";

export const SYSTEM_AUTHORITY = {
  ROOT: "ROOT",
  SUPER_ADMIN: "SUPER_ADMIN",
  SYSTEM: "SYSTEM",
  NONE: "NONE",
} as const;

export type SystemAuthority = (typeof SYSTEM_AUTHORITY)[keyof typeof SYSTEM_AUTHORITY];

const ROOT_LEVEL: ReadonlySet<string> = new Set([
  SYSTEM_AUTHORITY.ROOT,
  SYSTEM_AUTHORITY.SUPER_ADMIN,
]);

export type SystemAuthoritySlice = {
  roleKey: string | null | undefined;
  systemAuthority?: string | null;
};

export function normalizeSystemAuthority(
  value: string | null | undefined,
): SystemAuthority {
  const k = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (k === SYSTEM_AUTHORITY.ROOT) return SYSTEM_AUTHORITY.ROOT;
  if (k === SYSTEM_AUTHORITY.SUPER_ADMIN) return SYSTEM_AUTHORITY.SUPER_ADMIN;
  if (k === SYSTEM_AUTHORITY.SYSTEM) return SYSTEM_AUTHORITY.SYSTEM;
  return SYSTEM_AUTHORITY.NONE;
}

/** Autorité plateforme (root / super admin) — indépendante du département métier. */
export function hasSystemRootAuthority(slice: SystemAuthoritySlice): boolean {
  const auth = normalizeSystemAuthority(slice.systemAuthority);
  if (ROOT_LEVEL.has(auth)) return true;
  return isSuperAdminRoleKey(slice.roleKey);
}

/** Rôle effectif pour guards middleware / navigation (promotion SA si autorité système). */
export function resolveEffectivePlatformRoleKey(
  roleKey: string | null | undefined,
  systemAuthority?: string | null,
): string {
  if (hasSystemRootAuthority({ roleKey, systemAuthority })) {
    return ROLE_KEYS.SUPER_ADMIN;
  }
  return normalizeRoleKey(roleKey);
}

export function isRootAuthority(systemAuthority: string | null | undefined): boolean {
  return normalizeSystemAuthority(systemAuthority) === SYSTEM_AUTHORITY.ROOT;
}
