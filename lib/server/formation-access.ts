import { redirect } from "next/navigation";
import { getModulePermissions, getUserRole, isSuperAdmin } from "@/lib/server/permissions";

const FORMATION_ROLES = new Set(["responsable_formation", "directeur_general", "super_admin"]);

export async function assertFormationRead(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && FORMATION_ROLES.has(role)) return;
  const perms = await getModulePermissions(userId, ["formation"]);
  if (!perms.canRead) redirect("/access-denied");
}

export async function assertFormationWrite(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && FORMATION_ROLES.has(role)) return;
  const perms = await getModulePermissions(userId, ["formation"]);
  if (!perms.canCreate && !perms.canUpdate) redirect("/access-denied");
}

export async function canFormationDelete(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role && FORMATION_ROLES.has(role)) return true;
  const perms = await getModulePermissions(userId, ["formation"]);
  return perms.canDelete;
}
