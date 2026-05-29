/**
 * Authorization Matrix Engine — Phase 5.
 * Point d'entrée unique : scope → routes → actions.
 */
import {
  canAccessPathForProfile,
  hasAdminConsoleAccess,
  isSuperAdminOperationalBlocked,
} from "@/lib/auth/permissions";
import {
  isAdminUtilityPath,
  isAuthenticatedUtilityPath,
  isLayoutGuardedPath,
} from "@/lib/auth/route-utility-paths";
import { isControlPlaneActor, resolveAuthorityPlane } from "@/lib/auth/control-plane-authority";
import { resolveAuthorityDepartmentKey } from "@/lib/auth/profile-authority";
import {
  hasSystemRootAuthority,
  normalizeSystemAuthority,
  resolveEffectivePlatformRoleKey,
  type SystemAuthority,
} from "@/lib/auth/system-authority";
import { normalizeRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import {
  DEPARTMENT_KEYS,
  type DepartmentKey,
} from "@/lib/departments/department-config";
import {
  getMatrixActionRule,
  MATRIX_CONTROL_PLANE_PREFIXES,
  type MatrixAction,
} from "@/lib/auth/authorization-matrix-rules";
import type {
  AuthorizationMatrixEngine,
  MatrixAuthorityScope,
} from "@/lib/auth/authorization-matrix-foundation";
import { resolveAuthorityRoutePrefixes } from "@/lib/navigation/route-authority";

export const AUTHORIZATION_MATRIX_ENGINE_VERSION = "matrix-engine-v1" as const;

export type PlatformAuthorityProfile = {
  roleKey: string | null;
  systemAuthority: string | null;
  departmentKey: string | null;
};

export type MatrixAuthorityScopeView = {
  systemAuthority: SystemAuthority;
  effectiveRoleKey: string;
  isPlatformRoot: boolean;
  isAdminConsole: boolean;
  isControlPlane: boolean;
  plane: ReturnType<typeof resolveAuthorityPlane>;
};

export type ModulePermissionSnapshot = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type MatrixEvaluationContext = {
  profile: PlatformAuthorityProfile;
  moduleKey?: string;
  modulePermissions?: ModulePermissionSnapshot;
};

function resolveMatrixAuthorityScope(profile: PlatformAuthorityProfile): MatrixAuthorityScopeView {
  const systemAuthority = normalizeSystemAuthority(profile.systemAuthority);
  const isPlatformRoot = hasSystemRootAuthority(profile);
  const isControlPlane = isControlPlaneActor(profile);
  return {
    systemAuthority,
    effectiveRoleKey: resolveEffectivePlatformRoleKey(
      profile.roleKey,
      profile.systemAuthority,
    ),
    isPlatformRoot,
    isAdminConsole: hasAdminConsoleAccess(
      profile.roleKey,
      profile.departmentKey,
      profile.systemAuthority,
    ),
    isControlPlane,
    plane: resolveAuthorityPlane(profile),
  };
}

/** Actions accordées par défaut selon le scope (sans table permissions). */
function resolveDefaultActions(scope: MatrixAuthorityScopeView): readonly string[] {
  if (scope.isControlPlane) {
    return [
      "user.admin.update",
      "user.role.update",
      "user.deactivate",
      "approval.decide",
      "settings.manage",
      "governance.export",
    ];
  }
  if (scope.isAdminConsole) {
    return ["approval.decide", "governance.export"];
  }
  return [];
}

/** Modules métier déduits du département effectif. */
function inferModuleKeys(departmentKey: DepartmentKey | null): readonly string[] {
  if (!departmentKey) return [];
  const map: Partial<Record<DepartmentKey, readonly string[]>> = {
    [DEPARTMENT_KEYS.VENTE]: ["clients", "products", "crm"],
    [DEPARTMENT_KEYS.FINANCE]: ["finance"],
    [DEPARTMENT_KEYS.RH]: ["rh"],
    [DEPARTMENT_KEYS.FORMATION]: ["formation"],
    [DEPARTMENT_KEYS.MARKETING]: ["marketing"],
    [DEPARTMENT_KEYS.LOGISTIQUE]: ["logistics"],
  };
  return map[departmentKey] ?? [];
}

/** Scope matriciel complet — calcul pur (pas d'I/O). */
export function resolveMatrixScope(
  profile: PlatformAuthorityProfile,
  options?: { moduleKeys?: readonly string[] },
): MatrixAuthorityScope {
  const scope = resolveMatrixAuthorityScope(profile);
  const authorityDept = resolveAuthorityDepartmentKey(
    profile.roleKey,
    profile.departmentKey,
    profile.systemAuthority,
  );
  const routePrefixes = scope.isControlPlane
    ? [...MATRIX_CONTROL_PLANE_PREFIXES]
    : [
        ...resolveAuthorityRoutePrefixes(
          profile.roleKey,
          profile.departmentKey,
          profile.systemAuthority,
        ),
      ];

  return {
    systemAuthority: scope.systemAuthority,
    departmentKey: authorityDept,
    roleKey: scope.effectiveRoleKey,
    moduleKeys: options?.moduleKeys ?? inferModuleKeys(authorityDept),
    routePrefixes,
    actions: resolveDefaultActions(scope),
  };
}

function permissionAllows(
  perms: ModulePermissionSnapshot | undefined,
  permission: "read" | "create" | "update" | "delete",
): boolean {
  if (!perms) return false;
  switch (permission) {
    case "read":
      return perms.canRead;
    case "create":
      return perms.canCreate;
    case "update":
      return perms.canUpdate;
    case "delete":
      return perms.canDelete;
    default:
      return false;
  }
}

/** Évalue une action via les règles déclaratives + scope. */
export function matrixCanExecuteAction(
  action: MatrixAction,
  profile: PlatformAuthorityProfile,
  ctx?: Pick<MatrixEvaluationContext, "moduleKey" | "modulePermissions">,
): boolean {
  const rule = getMatrixActionRule(action);
  if (!rule) return false;

  const scope = resolveMatrixAuthorityScope(profile);

  if (rule.denyControlPlane && scope.isControlPlane) {
    return false;
  }

  switch (rule.requirement) {
    case "platform_root":
      return scope.isPlatformRoot;
    case "admin_console":
      return scope.isPlatformRoot || scope.isAdminConsole;
    case "business_operational": {
      if (scope.isControlPlane) return false;
      const role = normalizeRoleKey(profile.roleKey);
      if (role === ROLE_KEYS.SUPER_ADMIN) return false;
      if (isSuperAdminOperationalBlocked(role)) return false;
      return true;
    }
    case "module_permission": {
      if (scope.isControlPlane) {
        return rule.permission === "read";
      }
      if (!ctx?.modulePermissions || !rule.permission) return false;
      return permissionAllows(ctx.modulePermissions, rule.permission);
    }
    default:
      return false;
  }
}

/** Accès route — aligné authorization-core (sans import circulaire). */
export function matrixCanAccessRoute(
  pathname: string,
  profile: PlatformAuthorityProfile,
): boolean {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (isAuthenticatedUtilityPath(path)) return true;
  if (isLayoutGuardedPath(path)) return true;

  if (isAdminUtilityPath(path)) {
    return hasAdminConsoleAccess(
      profile.roleKey,
      profile.departmentKey,
      profile.systemAuthority,
    );
  }

  return canAccessPathForProfile(
    path,
    profile.roleKey,
    profile.departmentKey,
    profile.systemAuthority,
  );
}

export type SyncMatrixEngine = {
  profile: PlatformAuthorityProfile;
  resolveScope(): MatrixAuthorityScope;
  canAccessRoute(pathname: string): boolean;
  canExecuteAction(
    action: MatrixAction,
    ctx?: Pick<MatrixEvaluationContext, "moduleKey" | "modulePermissions">,
  ): boolean;
};

/** Moteur synchrone lié à un profil déjà résolu (RSC, guards). */
export function createSyncMatrixEngine(profile: PlatformAuthorityProfile): SyncMatrixEngine {
  let cachedScope: MatrixAuthorityScope | null = null;
  return {
    profile,
    resolveScope() {
      if (!cachedScope) {
        cachedScope = resolveMatrixScope(profile);
      }
      return cachedScope;
    },
    canAccessRoute(pathname) {
      return matrixCanAccessRoute(pathname, profile);
    },
    canExecuteAction(action, ctx) {
      return matrixCanExecuteAction(action, profile, ctx);
    },
  };
}

/** Contrat async — résolution profil externe (API routes). */
export function createAuthorizationMatrixEngine(deps: {
  loadProfile: (userId: string) => Promise<PlatformAuthorityProfile | null>;
}): AuthorizationMatrixEngine {
  return {
    async resolveScope(userId) {
      const profile = await deps.loadProfile(userId);
      if (!profile) {
        return {
          systemAuthority: "NONE" as const,
          departmentKey: null,
          roleKey: "",
          moduleKeys: [],
          routePrefixes: [],
          actions: [],
        };
      }
      return resolveMatrixScope(profile);
    },
    async canAccessRoute(userId, pathname) {
      const profile = await deps.loadProfile(userId);
      if (!profile) return false;
      return matrixCanAccessRoute(pathname, profile);
    },
    async canExecuteAction(userId, action) {
      const profile = await deps.loadProfile(userId);
      if (!profile) return false;
      return matrixCanExecuteAction(action as MatrixAction, profile);
    },
  };
}
