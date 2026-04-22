import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type ClientsPermissions = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type ModulePermissions = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type PermissionAction = "read" | "create" | "update" | "delete";

const FALLBACK_ROLE_PERMISSIONS: Record<string, ClientsPermissions> = {
  super_admin: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
  directeur_general: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
  responsable_vente: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
  comptable: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
  auditeur: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
  employe: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
};

const BOOTSTRAP_PERMISSIONS: ClientsPermissions = {
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
};

function canDoAction(permissions: ClientsPermissions, action: PermissionAction) {
  if (action === "read") return permissions.canRead;
  if (action === "create") return permissions.canCreate;
  if (action === "update") return permissions.canUpdate;
  return permissions.canDelete;
}

async function getRoleKey(userId: string) {
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role_key")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  return profile?.role_key ?? null;
}

export async function getModulePermissions(
  userId: string,
  moduleKeys: string[],
): Promise<ModulePermissions> {
  const supabase = getSupabaseServerClient();
  const roleKey = await getRoleKey(userId);

  if (!roleKey) {
    return BOOTSTRAP_PERMISSIONS;
  }

  const { data: modulePermission } = await supabase
    .from("permissions")
    .select("can_create,can_read,can_update,can_delete")
    .eq("role_key", roleKey)
    .in("module_key", moduleKeys)
    .is("deleted_at", null);

  if (modulePermission && modulePermission.length > 0) {
    const canRead = modulePermission.some((permission) => permission.can_read);
    const canCreate = modulePermission.some((permission) => permission.can_create);
    const canUpdate = modulePermission.some((permission) => permission.can_update);
    const canDelete = modulePermission.some((permission) => permission.can_delete);
    return { canRead, canCreate, canUpdate, canDelete };
  }

  return FALLBACK_ROLE_PERMISSIONS[roleKey] ?? BOOTSTRAP_PERMISSIONS;
}

export async function getClientsPermissions(userId: string): Promise<ClientsPermissions> {
  return (await getModulePermissions(userId, ["clients", "vente"])) as ClientsPermissions;
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
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role_key")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(`Impossible de récupérer le rôle utilisateur: ${error.message}`);
  }

  return profile?.role_key ?? null;
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === "super_admin";
}

export async function assertSuperAdmin(userId: string) {
  const allowed = await isSuperAdmin(userId);
  if (!allowed) {
    throw new Error("Accès refusé");
  }
}
