import { cache } from "react";
import { unstable_cache } from "next/cache";
import { hasAdminConsoleAccess } from "@/lib/auth/permissions";
import type { SupervisionScope } from "@/lib/auth/permissions";
import { normalizeRoleKey } from "@/lib/auth/roles";
import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import {
  SHELL_LAYOUT_MODULE_KEYS,
  aggregatePermissionsForModuleKeys,
} from "@/lib/server/shell-permission-helpers";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { logError } from "@/lib/logger";

export { SHELL_LAYOUT_MODULE_KEYS, aggregatePermissionsForModuleKeys } from "@/lib/server/shell-permission-helpers";

export type ClientsPermissions = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type ModulePermissions = ClientsPermissions;
/** Compat historique — les permissions fines viennent de la table `permissions` par `role_key`. */
export type CanonicalRole = "admin" | "manager" | "agent";

type PermissionAction = "read" | "create" | "update" | "delete";

type PermissionRow = {
  module_key?: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
};

export type ShellLayoutPermissions = {
  clients: ModulePermissions;
  products: ModulePermissions;
  finance: ModulePermissions;
  rh: ModulePermissions;
  logistics: ModulePermissions;
  formation: ModulePermissions;
  marketing: ModulePermissions;
  crm: ModulePermissions;
};

/** Default: deny all */
const DENY_ALL: ModulePermissions = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};

const DENY_ALL_SHELL: ShellLayoutPermissions = {
  clients: DENY_ALL,
  products: DENY_ALL,
  finance: DENY_ALL,
  rh: DENY_ALL,
  logistics: DENY_ALL,
  formation: DENY_ALL,
  marketing: DENY_ALL,
  crm: DENY_ALL,
};

function canDoAction(
  permissions: ClientsPermissions,
  action: PermissionAction,
) {
  switch (action) {
    case "read":
      return permissions.canRead;
    case "create":
      return permissions.canCreate;
    case "update":
      return permissions.canUpdate;
    case "delete":
      return permissions.canDelete;
    default:
      return false;
  }
}

function aggregatePermissions(rows: PermissionRow[]): ModulePermissions {
  return {
    canRead: rows.some((p) => p.can_read),
    canCreate: rows.some((p) => p.can_create),
    canUpdate: rows.some((p) => p.can_update),
    canDelete: rows.some((p) => p.can_delete),
  };
}

export type ProfileAuthBrief = {
  roleKey: string | null;
  departmentKey: string | null;
  departmentId: string | null;
  ok: boolean;
  supervisionScope: SupervisionScope;
};

/**
 * Contexte d’autorisation profil (rôle générique + département) — une requête par cycle RSC.
 */
export const getProfileAuthBrief = cache(async (userId: string): Promise<ProfileAuthBrief> => {
  const row = await getCachedProfileRow(userId);
  return {
    roleKey: row.roleKey,
    departmentKey: row.departmentKey,
    departmentId: row.departmentId,
    ok: row.ok,
    supervisionScope: row.supervisionScope,
  };
});

export const SHELL_PERMISSIONS_TAG = "shell-permissions";

/**
 * Permissions shell — une requête `permissions` pour tous les modules navigation (cache 60s par rôle).
 */
async function fetchShellLayoutPermissionsByRole(roleKey: string): Promise<ShellLayoutPermissions> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("permissions")
    .select("module_key,can_create,can_read,can_update,can_delete")
    .eq("role_key", roleKey)
    .in("module_key", [...SHELL_LAYOUT_MODULE_KEYS])
    .is("deleted_at", null);

  if (error) {
    logError("auth", "getShellLayoutPermissions error", {
      error: error.message,
      roleKey,
    });
    return DENY_ALL_SHELL;
  }

  const rows = (data ?? []) as PermissionRow[];

  return {
    clients: aggregatePermissionsForModuleKeys(rows, ["clients", "vente"]),
    products: aggregatePermissionsForModuleKeys(rows, ["produits", "vente"]),
    finance: aggregatePermissionsForModuleKeys(rows, ["finance"]),
    rh: aggregatePermissionsForModuleKeys(rows, ["rh"]),
    logistics: aggregatePermissionsForModuleKeys(rows, ["logistics"]),
    formation: aggregatePermissionsForModuleKeys(rows, ["formation", "consultation"]),
    marketing: aggregatePermissionsForModuleKeys(rows, ["marketing"]),
    crm: aggregatePermissionsForModuleKeys(rows, ["crm"]),
  };
}

const loadShellLayoutPermissionsByRole = unstable_cache(
  async (roleKey: string) => fetchShellLayoutPermissionsByRole(roleKey),
  [SHELL_PERMISSIONS_TAG],
  { revalidate: 60, tags: [SHELL_PERMISSIONS_TAG] },
);

export const getShellLayoutPermissions = cache(
  async (userId: string): Promise<ShellLayoutPermissions> => {
    if (!userId?.trim()) return DENY_ALL_SHELL;

    const brief = await getProfileAuthBrief(userId);
    if (!brief.ok || !brief.roleKey) return DENY_ALL_SHELL;

    return loadShellLayoutPermissionsByRole(brief.roleKey);
  },
);

const getModulePermissionsMemo = cache(
  async (userId: string, sortedModulesKey: string): Promise<ModulePermissions> => {
    const moduleKeys = sortedModulesKey.split(",").filter(Boolean);
    if (!userId || !moduleKeys.length) {
      return DENY_ALL;
    }

    const brief = await getProfileAuthBrief(userId);

    if (!brief.ok || !brief.roleKey) {
      return DENY_ALL;
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("permissions")
      .select("can_create,can_read,can_update,can_delete")
      .eq("role_key", brief.roleKey)
      .in("module_key", moduleKeys)
      .is("deleted_at", null);

    if (error) {
      logError("auth", "getModulePermissions error", {
        error: error.message,
        userId,
        moduleKeys,
      });
      return DENY_ALL;
    }

    if (!data?.length) {
      return DENY_ALL;
    }

    return aggregatePermissions(data as PermissionRow[]);
  },
);

/**
 * Permissions par module (agrégation sur les lignes `permissions` du rôle exact du profil).
 */
export async function getModulePermissions(
  userId: string,
  moduleKeys: string[],
): Promise<ModulePermissions> {
  if (!userId?.trim() || !moduleKeys.length) {
    return DENY_ALL;
  }
  const sortedKey = [...moduleKeys].sort().join(",");
  return getModulePermissionsMemo(userId.trim(), sortedKey);
}

/**
 * Permissions clients
 */
export async function getClientsPermissions(
  userId: string,
): Promise<ClientsPermissions> {
  return getModulePermissions(userId, ["clients", "vente"]);
}

/**
 * Vérifie permission (SAFE — ne crash jamais)
 */
export async function assertClientsPermission(
  userId: string,
  action: PermissionAction,
): Promise<ClientsPermissions | null> {
  const permissions = await getClientsPermissions(userId);

  if (!permissions || !canDoAction(permissions, action)) {
    return null;
  }

  return permissions;
}

/**
 * Rôle utilisateur brut (`profiles.role_key`).
 */
export const getUserRole = cache(async (userId: string): Promise<string | null> => {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return null;
  return brief.roleKey;
});

/** Classification grossière (UX / redirections héritées). */
export function toCanonicalRole(roleKey: string | null | undefined): CanonicalRole {
  const r = normalizeRoleKey(roleKey);
  if (r === "super_admin") return "admin";
  if (r === "manager" || r === "accountant" || r === "auditor") return "manager";
  return "agent";
}

export async function getCanonicalUserRole(userId: string): Promise<CanonicalRole> {
  const role = await getUserRole(userId);
  return toCanonicalRole(role);
}

/**
 * Vérifie super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "super_admin";
}

export async function isAdminRole(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  return hasAdminConsoleAccess(brief.roleKey, brief.departmentKey);
}

/** Aligné sur `public.is_automation_operator()` — exploitation fichiers / orchestrations automation. */
export async function isAutomationOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

/** Aligné sur `public.is_compliance_operator()` — FINANCE / ADMINISTRATION / console admin. */
export async function isComplianceOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  const dk = normalizeDepartmentKey(brief.departmentKey);
  return dk === DEPARTMENT_KEYS.ADMINISTRATION || dk === DEPARTMENT_KEYS.FINANCE;
}

/** ADMINISTRATION / AUDIT / console admin — aligné SQL `is_observability_operator`. */
export async function isObservabilityOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  const dk = normalizeDepartmentKey(brief.departmentKey);
  return dk === DEPARTMENT_KEYS.ADMINISTRATION || dk === DEPARTMENT_KEYS.AUDIT;
}

/** Aligné SQL `is_ai_operator` — console admin ou département ADMINISTRATION. */
export async function isAiOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

/** Aligné SQL `is_multitenant_operator` — console admin ou département ADMINISTRATION. */
export async function isMultitenantOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

/** Aligné SQL `is_cloud_operator` — console admin ou département ADMINISTRATION. */
export async function isCloudOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

/** Aligné SQL `is_platform_operator` — console admin ou département ADMINISTRATION. */
export async function isPlatformOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

/** Aligné SQL `is_ecosystem_operator` — console admin ou département ADMINISTRATION. */
export async function isEcosystemOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

/** Aligné SQL `is_governance_platform_operator` — console admin ou département ADMINISTRATION. */
export async function isGovernancePlatformOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

/** Aligné SQL `is_resilience_operator` — console admin ou département ADMINISTRATION. */
export async function isResilienceOperator(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok) return false;
  if (hasAdminConsoleAccess(brief.roleKey, brief.departmentKey)) return true;
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.ADMINISTRATION;
}

/**
 * Assert super admin SAFE
 */
export async function assertSuperAdmin(userId: string): Promise<boolean> {
  return await isSuperAdmin(userId);
}

export async function assertAdminRole(userId: string): Promise<boolean> {
  return await isAdminRole(userId);
}

/**
 * Liste profils (admin UI)
 */
export async function listProfilesForAdminSelect(): Promise<
  { id: string; label: string }[]
> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .is("deleted_at", null)
    .order("last_name", { ascending: true })
    .limit(500);

  if (error) {
    logError("auth", "listProfilesForAdminSelect error", { error: error.message });
    return [];
  }

  return (data ?? []).map((p) => {
    const name = [p.first_name, p.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: p.id,
      label: name || p.email || p.id.slice(0, 8),
    };
  });
}
