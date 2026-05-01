import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { logError } from "@/lib/logger";

export type ClientsPermissions = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type ModulePermissions = ClientsPermissions;
export type CanonicalRole = "admin" | "manager" | "agent";

type PermissionAction = "read" | "create" | "update" | "delete";

type PermissionRow = {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
};

/** Default: deny all */
const DENY_ALL: ModulePermissions = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};

const ADMIN_ROLE_KEYS = new Set(["super_admin", "admin", "directeur_general"]);
const MANAGER_ROLE_KEYS = new Set([
  "manager",
  "responsable_vente",
  "comptable",
  "responsable_formation",
  "responsable_consultation",
  "responsable_rh",
  "responsable_marketing",
  "responsable_logistique",
]);

function canDoAction(
  permissions: ClientsPermissions,
  action: PermissionAction
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

/**
 * Récupère le rôle utilisateur (une requête profil par userId et par requête RSC).
 */
const getProfileRoleKey = cache(async (userId: string): Promise<{ roleKey: string | null; ok: boolean }> => {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role_key")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    logError("auth", "getProfileRoleKey error", { error: error.message, userId });
    return { roleKey: null, ok: false };
  }

  if (!data?.role_key || !String(data.role_key).trim()) {
    return { roleKey: null, ok: true };
  }

  return { roleKey: String(data.role_key).trim(), ok: true };
});

const getModulePermissionsMemo = cache(
  async (userId: string, sortedModulesKey: string): Promise<ModulePermissions> => {
    const moduleKeys = sortedModulesKey.split(",").filter(Boolean);
    if (!userId || !moduleKeys.length) {
      return DENY_ALL;
    }

    const { roleKey, ok } = await getProfileRoleKey(userId);

    if (!ok || !roleKey) {
      return DENY_ALL;
    }

    const canonicalRole = toCanonicalRole(roleKey);
    const roleKeysToCheck =
      canonicalRole === roleKey ? [roleKey] : [roleKey, canonicalRole];

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("permissions")
      .select("can_create,can_read,can_update,can_delete")
      .in("role_key", roleKeysToCheck)
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
 * Permissions par module
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
  userId: string
): Promise<ClientsPermissions> {
  return getModulePermissions(userId, ["clients", "vente"]);
}

/**
 * Vérifie permission (SAFE — ne crash jamais)
 */
export async function assertClientsPermission(
  userId: string,
  action: PermissionAction
): Promise<ClientsPermissions | null> {
  const permissions = await getClientsPermissions(userId);

  if (!permissions || !canDoAction(permissions, action)) {
    return null;
  }

  return permissions;
}

/**
 * Rôle utilisateur (dédoublonné avec getProfileRoleKey quand les deux sont utilisés).
 */
export const getUserRole = cache(async (userId: string): Promise<string | null> => {
  const { roleKey, ok } = await getProfileRoleKey(userId);
  if (!ok) return null;
  return roleKey;
});

export function toCanonicalRole(roleKey: string | null | undefined): CanonicalRole {
  const normalized = String(roleKey ?? "").trim().toLowerCase();
  if (ADMIN_ROLE_KEYS.has(normalized)) return "admin";
  if (MANAGER_ROLE_KEYS.has(normalized)) return "manager";
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
  const role = await getUserRole(userId);
  return toCanonicalRole(role) === "admin";
}

/**
 * Assert super admin SAFE
 */
export async function assertSuperAdmin(
  userId: string
): Promise<boolean> {
  return await isSuperAdmin(userId);
}

export async function assertAdminRole(
  userId: string
): Promise<boolean> {
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