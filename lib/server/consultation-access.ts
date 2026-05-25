import { redirect } from "next/navigation";
import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { getModulePermissions, getProfileAuthBrief, getUserRole, isSuperAdmin } from "@/lib/server/permissions";
const CONSULTATION_LEGACY_ROLES = new Set([
  "responsable_consultation",
  "responsable_formation",
  "directeur_general",
  "super_admin",
]);

async function hasFormationDepartmentAccess(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.FORMATION;
}

export async function assertConsultationRead(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && CONSULTATION_LEGACY_ROLES.has(role)) return;
  if (await hasFormationDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["consultation", "formation"]);
  if (!perms.canRead) redirect("/access-denied");
}

export async function assertConsultationWrite(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && CONSULTATION_LEGACY_ROLES.has(role)) return;
  if (await hasFormationDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["consultation", "formation"]);
  if (!perms.canCreate && !perms.canUpdate) redirect("/access-denied");
}

export async function canConsultationDelete(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role && CONSULTATION_LEGACY_ROLES.has(role)) return true;
  if (await hasFormationDepartmentAccess(userId)) return true;
  const perms = await getModulePermissions(userId, ["consultation", "formation"]);
  return perms.canDelete;
}
