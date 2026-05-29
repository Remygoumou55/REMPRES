/**
 * Phase 3 — Politique root immuable (pure, testable sans DB).
 */
import { isRootAuthority, normalizeSystemAuthority, SYSTEM_AUTHORITY } from "@/lib/auth/system-authority";
import { isSuperAdminRoleKey, normalizeRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import type { ProfileAuthoritySnapshot, RootMutationIntent } from "@/lib/governance/runtime/root-protection";
import { hasSystemRootAuthority } from "@/lib/auth/system-authority";

/** Nombre minimum de comptes plateforme root actifs requis. */
export const MIN_ACTIVE_PLATFORM_ROOTS = 1;

export type ImmutableRootEvaluation = {
  allowed: boolean;
  code?: string;
  message?: string;
};

export type ImmutableRootEvaluationInput = {
  before: ProfileAuthoritySnapshot;
  intent: RootMutationIntent;
  activePlatformRoots: number;
  activeStrictRoots: number;
  callerUserId?: string;
  callerSystemAuthority?: string | null;
  callerRoleKey?: string | null;
};

function isActiveRootRow(row: ProfileAuthoritySnapshot): boolean {
  if (row.deleted_at != null) return false;
  if (row.is_active === false) return false;
  return hasSystemRootAuthority({
    roleKey: row.role_key,
    systemAuthority: row.system_authority ?? null,
  });
}

function resolvesNextRoot(intent: RootMutationIntent, before: ProfileAuthoritySnapshot): boolean {
  const nextRole = normalizeRoleKey(intent.nextRoleKey);
  const nextAuth = normalizeSystemAuthority(
    intent.nextSystemAuthority ?? before.system_authority,
  );
  return (
    nextAuth === SYSTEM_AUTHORITY.ROOT ||
    nextAuth === SYSTEM_AUTHORITY.SUPER_ADMIN ||
    isSuperAdminRoleKey(nextRole)
  );
}

function resolvesNextActive(intent: RootMutationIntent, before: ProfileAuthoritySnapshot): boolean {
  return intent.nextIsActive !== undefined ? intent.nextIsActive : before.is_active !== false;
}

/**
 * Évalue une mutation d'autorité sans accès DB (compteurs fournis par l'appelant).
 */
export function evaluateImmutableRootMutation(
  input: ImmutableRootEvaluationInput,
): ImmutableRootEvaluation {
  const { before, intent, activePlatformRoots, activeStrictRoots, callerUserId } = input;
  const wasRoot = isActiveRootRow(before);
  const nextIsRoot = resolvesNextRoot(intent, before);
  const nextActive = resolvesNextActive(intent, before);
  const beforeAuth = normalizeSystemAuthority(before.system_authority);
  const nextAuth = normalizeSystemAuthority(
    intent.nextSystemAuthority ?? before.system_authority,
  );
  const nextRole = normalizeRoleKey(intent.nextRoleKey);

  const isLastPlatformRoot = wasRoot && activePlatformRoots <= MIN_ACTIVE_PLATFORM_ROOTS;
  const isLastStrictRoot =
    isRootAuthority(before.system_authority) && activeStrictRoots <= MIN_ACTIVE_PLATFORM_ROOTS;

  if (
    callerUserId &&
    callerUserId === before.id &&
    wasRoot &&
    isLastPlatformRoot &&
    (!nextIsRoot || beforeAuth !== nextAuth)
  ) {
    return {
      allowed: false,
      code: "SELF_ROOT_DEMOTION",
      message:
        "Vous ne pouvez pas retirer votre propre autorité root tant que vous êtes le dernier compte root actif.",
    };
  }

  if (isLastPlatformRoot && (!nextIsRoot || !nextActive)) {
    return {
      allowed: false,
      code: "LAST_PLATFORM_ROOT",
      message:
        "Impossible de retirer ou désactiver le dernier compte root de la plateforme. Promouvez d’abord un autre super administrateur.",
    };
  }

  if (isLastPlatformRoot && nextRole !== ROLE_KEYS.SUPER_ADMIN) {
    return {
      allowed: false,
      code: "LAST_ROOT_ROLE_DOWNGRADE",
      message: "Impossible de rétrograder le dernier compte root vers un rôle métier.",
    };
  }

  if (isLastStrictRoot && beforeAuth === SYSTEM_AUTHORITY.ROOT && nextAuth !== SYSTEM_AUTHORITY.ROOT) {
    return {
      allowed: false,
      code: "LAST_STRICT_ROOT_AUTHORITY",
      message:
        "Impossible de retirer l’autorité ROOT du dernier détenteur. Promouvez un autre compte ROOT d’abord.",
    };
  }

  if (
    nextAuth === SYSTEM_AUTHORITY.ROOT &&
    beforeAuth !== SYSTEM_AUTHORITY.ROOT &&
    !isRootAuthority(input.callerSystemAuthority)
  ) {
    return {
      allowed: false,
      code: "ROOT_GRANT_FORBIDDEN",
      message: "Seul un compte disposant de l’autorité ROOT peut promouvoir un autre compte au niveau ROOT.",
    };
  }

  return { allowed: true };
}
