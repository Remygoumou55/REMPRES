import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type ClientsPermissions = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type ModulePermissions = ClientsPermissions;

type PermissionAction = "read" | "create" | "update" | "delete";

type PermissionRow = {
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
};

/** Default: deny all — no implicit admin, no bootstrap grants. */
const DENY_ALL: ModulePermissions = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};

function canDoAction(permissions: ClientsPermissions, action: PermissionAction) {
  switch (action) {
    case "read":
      return permissions.canRead;
    case "create":
      return permissions.canCreate;
    case "update":
      return permissions.canUpdate;
    case "delete":
      return permissions.canDelete;
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
 * Lit le profil (rôle) en base. Erreur DB → ok: false (échec explicite).
 * Absence de ligne profil → roleKey null, ok: true.
 */
async function getProfileRoleKey(
  userId: string,
): Promise<{ roleKey: string | null; ok: boolean }> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role_key")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("getProfileRoleKey error:", error.message);
    return { roleKey: null, ok: false };
  }

  if (!data?.role_key || !String(data.role_key).trim()) {
    return { roleKey: null, ok: true };
  }

  return { roleKey: String(data.role_key).trim(), ok: true };
}

/**
 * Permissions issues de la table `permissions` uniquement.
 * - Pas de profil / pas de rôle → refus.
 * - Erreur lecture profil ou permissions → refus (fail closed).
 * - Aucune ligne permissions pour ce rôle + modules → refus (pas de fallback code).
 */
export async function getModulePermissions(
  userId: string,
  moduleKeys: string[],
): Promise<ModulePermissions> {
  if (!userId?.trim()) {
    return DENY_ALL;
  }

  if (!moduleKeys.length) {
    return DENY_ALL;
  }

  const { roleKey, ok } = await getProfileRoleKey(userId);
  if (!ok) {
    return DENY_ALL;
  }
  if (!roleKey) {
    return DENY_ALL;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("permissions")
    .select("can_create,can_read,can_update,can_delete")
    .eq("role_key", roleKey)
    .in("module_key", moduleKeys)
    .is("deleted_at", null);

  if (error) {
    console.error("getModulePermissions error:", error.message);
    return DENY_ALL;
  }

  if (!data?.length) {
    return DENY_ALL;
  }

  return aggregatePermissions(data as PermissionRow[]);
}

export async function getClientsPermissions(userId: string): Promise<ClientsPermissions> {
  return getModulePermissions(userId, ["clients", "vente"]);
}

export async function assertClientsPermission(userId: string, action: PermissionAction) {
  const permissions = await getClientsPermissions(userId);

  if (!canDoAction(permissions, action)) {
    throw new Error("Accès refusé");
  }

  return permissions;
}

export async function getUserRole(userId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role_key")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de récupérer le rôle utilisateur: ${error.message}`);
  }

  return data?.role_key?.trim() ?? null;
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "super_admin";
}

export async function assertSuperAdmin(userId: string) {
  if (!(await isSuperAdmin(userId))) {
    throw new Error("Accès refusé");
  }
}

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
    console.error("listProfilesForAdminSelect error:", error.message);
    return [];
  }

  return (data ?? []).map((p) => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();

    return {
      id: p.id,
      label: name || p.email || p.id.slice(0, 8),
    };
  });
}
