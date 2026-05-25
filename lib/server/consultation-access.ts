import { redirect } from "next/navigation";
import { getModulePermissions, getUserRole, isSuperAdmin } from "@/lib/server/permissions";

const CONSULTATION_ROLES = new Set(["responsable_consultation", "directeur_general", "super_admin"]);

export async function assertConsultationRead(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && CONSULTATION_ROLES.has(role)) return;
  const perms = await getModulePermissions(userId, ["consultation"]);
  if (!perms.canRead) redirect("/access-denied");
}

export async function assertConsultationWrite(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && CONSULTATION_ROLES.has(role)) return;
  const perms = await getModulePermissions(userId, ["consultation"]);
  if (!perms.canCreate && !perms.canUpdate) redirect("/access-denied");
}

export async function canConsultationDelete(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role && CONSULTATION_ROLES.has(role)) return true;
  const perms = await getModulePermissions(userId, ["consultation"]);
  return perms.canDelete;
}
