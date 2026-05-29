/**
 * Protection immuable du dernier compte root — mutations profils gouvernées (Phase 0 + Phase 3).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  hasSystemRootAuthority,
  isRootAuthority,
  normalizeSystemAuthority,
  SYSTEM_AUTHORITY,
} from "@/lib/auth/system-authority";
import { isSuperAdminRoleKey, normalizeRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import {
  evaluateImmutableRootMutation,
  MIN_ACTIVE_PLATFORM_ROOTS,
} from "@/lib/governance/runtime/immutable-root-policy";

export { MIN_ACTIVE_PLATFORM_ROOTS };

export class RootProtectionError extends Error {
  readonly code = "ROOT_PROTECTION_VIOLATION" as const;

  constructor(message: string, readonly reasonCode?: string) {
    super(message);
    this.name = "RootProtectionError";
  }
}

export type ProfileAuthoritySnapshot = {
  id: string;
  role_key: string | null;
  system_authority?: string | null;
  department_key?: string | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
};

export type ImmutableRootContext = {
  callerUserId: string;
  callerSystemAuthority?: string | null;
  callerRoleKey?: string | null;
};

function isActiveRootProfile(row: ProfileAuthoritySnapshot): boolean {
  if (row.deleted_at != null) return false;
  if (row.is_active === false) return false;
  return hasSystemRootAuthority({
    roleKey: row.role_key,
    systemAuthority: row.system_authority ?? null,
  });
}

function isActiveStrictRootProfile(row: ProfileAuthoritySnapshot): boolean {
  if (!isActiveRootProfile(row)) return false;
  return isRootAuthority(row.system_authority);
}

/** Compte les profils root actifs (autorité système ou role_key super_admin). */
export async function countActiveRootProfiles(
  admin: SupabaseClient,
): Promise<number> {
  const rows = await loadActiveProfileAuthorityRows(admin);
  return rows.filter((row) => isActiveRootProfile(row)).length;
}

/** Compte les profils avec autorité ROOT stricte (colonne system_authority = ROOT). */
export async function countActiveStrictRootProfiles(
  admin: SupabaseClient,
): Promise<number> {
  const rows = await loadActiveProfileAuthorityRows(admin);
  return rows.filter((row) => isActiveStrictRootProfile(row)).length;
}

export async function listActivePlatformRootProfileIds(
  admin: SupabaseClient,
): Promise<string[]> {
  const rows = await loadActiveProfileAuthorityRows(admin);
  return rows.filter((row) => isActiveRootProfile(row)).map((row) => row.id);
}

async function loadActiveProfileAuthorityRows(
  admin: SupabaseClient,
): Promise<ProfileAuthoritySnapshot[]> {
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

  return (data ?? []) as ProfileAuthoritySnapshot[];
}

export type RootMutationIntent = {
  targetUserId: string;
  nextRoleKey: string;
  nextDepartmentKey: string | null;
  nextSystemAuthority?: string | null;
  nextIsActive?: boolean;
};

/**
 * Phase 3 — Politique root immuable complète (plateforme + ROOT strict + grant ROOT).
 */
export async function assertImmutableRootPolicy(
  admin: SupabaseClient,
  ctx: ImmutableRootContext,
  before: ProfileAuthoritySnapshot,
  intent: RootMutationIntent,
): Promise<void> {
  const [activePlatformRoots, activeStrictRoots] = await Promise.all([
    countActiveRootProfiles(admin),
    countActiveStrictRootProfiles(admin),
  ]);

  const evaluation = evaluateImmutableRootMutation({
    before,
    intent,
    activePlatformRoots,
    activeStrictRoots,
    callerUserId: ctx.callerUserId,
    callerSystemAuthority: ctx.callerSystemAuthority,
    callerRoleKey: ctx.callerRoleKey,
  });

  if (!evaluation.allowed) {
    throw new RootProtectionError(
      evaluation.message ?? "Mutation root refusée par la politique immuable.",
      evaluation.code,
    );
  }
}

/**
 * Bloque toute mutation qui retirerait le dernier root actif de la plateforme.
 * @deprecated Préférer assertImmutableRootPolicy — conservé pour compatibilité interne.
 */
export async function assertRootMutationAllowed(
  admin: SupabaseClient,
  before: ProfileAuthoritySnapshot,
  intent: RootMutationIntent,
  ctx?: ImmutableRootContext,
): Promise<void> {
  await assertImmutableRootPolicy(
    admin,
    ctx ?? { callerUserId: intent.targetUserId },
    before,
    intent,
  );
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
