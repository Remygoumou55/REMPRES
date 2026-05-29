/**
 * Protection immuable du dernier compte root — mutations profils gouvernées.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasSystemRootAuthority,
  normalizeSystemAuthority,
  SYSTEM_AUTHORITY,
} from "@/lib/auth/system-authority";
import { isSuperAdminRoleKey, normalizeRoleKey, ROLE_KEYS } from "@/lib/auth/roles";

export class RootProtectionError extends Error {
  readonly code = "ROOT_PROTECTION_VIOLATION" as const;

  constructor(message: string) {
    super(message);
    this.name = "RootProtectionError";
  }
}

export type ProfileAuthoritySnapshot = {
  id: string;
  role_key: string | null;
  system_authority?: string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
};

function isActiveRootProfile(row: ProfileAuthoritySnapshot): boolean {
  if (row.deleted_at != null) return false;
  if (row.is_active === false) return false;
  return hasSystemRootAuthority({
    roleKey: row.role_key,
    systemAuthority: row.system_authority ?? null,
  });
}

/** Compte les profils root actifs (autorité système ou role_key super_admin). */
export async function countActiveRootProfiles(
  admin: SupabaseClient,
): Promise<number> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, role_key, system_authority, is_active, deleted_at")
    .is("deleted_at", null)
    .eq("is_active", true);

  if (error) {
    throw new RootProtectionError(
      "Impossible de vérifier les comptes root actifs. Mutation bloquée par sécurité.",
    );
  }

  return (data ?? []).filter((row) =>
    isActiveRootProfile(row as ProfileAuthoritySnapshot),
  ).length;
}

export type RootMutationIntent = {
  targetUserId: string;
  nextRoleKey: string;
  nextDepartmentKey: string | null;
  nextSystemAuthority?: string | null;
  nextIsActive?: boolean;
};

/**
 * Bloque toute mutation qui retirerait le dernier root actif de la plateforme.
 */
export async function assertRootMutationAllowed(
  admin: SupabaseClient,
  before: ProfileAuthoritySnapshot,
  intent: RootMutationIntent,
): Promise<void> {
  const wasRoot = isActiveRootProfile(before);
  const nextRole = normalizeRoleKey(intent.nextRoleKey);
  const nextAuth = normalizeSystemAuthority(
    intent.nextSystemAuthority ?? before.system_authority,
  );
  const nextIsRoot =
    nextAuth === SYSTEM_AUTHORITY.ROOT ||
    nextAuth === SYSTEM_AUTHORITY.SUPER_ADMIN ||
    isSuperAdminRoleKey(nextRole);
  const nextActive =
    intent.nextIsActive !== undefined ? intent.nextIsActive : before.is_active !== false;

  if (!wasRoot) return;
  if (nextIsRoot && nextActive && before.deleted_at == null) return;

  const activeRoots = await countActiveRootProfiles(admin);
  const otherRootsRemain =
    activeRoots > 1 || (activeRoots === 1 && !wasRoot);

  if (otherRootsRemain) return;

  if (!nextIsRoot || !nextActive) {
    throw new RootProtectionError(
      "Impossible de retirer ou désactiver le dernier compte root de la plateforme. Promouvez d’abord un autre super administrateur.",
    );
  }

  if (nextRole !== ROLE_KEYS.SUPER_ADMIN) {
    throw new RootProtectionError(
      "Impossible de rétrograder le dernier compte root vers un rôle métier.",
    );
  }
}

export type CoercedProfilePatch = {
  role_key?: string;
  department_key?: string | null;
  system_authority?: string;
};

/** Payload DB cohérent : autorité système root impose super_admin sans département. */
export function coerceRootProfilePatch(patch: {
  role_key?: string;
  department_key?: string | null;
  system_authority?: string | null;
}): CoercedProfilePatch {
  const auth = normalizeSystemAuthority(patch.system_authority);
  const role = patch.role_key != null ? normalizeRoleKey(patch.role_key) : null;

  if (
    auth === SYSTEM_AUTHORITY.ROOT ||
    auth === SYSTEM_AUTHORITY.SUPER_ADMIN ||
    (role && isSuperAdminRoleKey(role))
  ) {
    return {
      ...patch,
      role_key: ROLE_KEYS.SUPER_ADMIN,
      department_key: null,
      system_authority:
        auth === SYSTEM_AUTHORITY.NONE
          ? SYSTEM_AUTHORITY.SUPER_ADMIN
          : auth,
    };
  }

  const { system_authority, ...rest } = patch;
  const result: CoercedProfilePatch = { ...rest };
  if (system_authority != null && system_authority !== "") {
    result.system_authority = normalizeSystemAuthority(system_authority);
  }
  return result;
}
