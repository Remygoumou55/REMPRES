import { redirect } from "next/navigation";
import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { getModulePermissions, getProfileAuthBrief, getUserRole, isSuperAdmin } from "@/lib/server/permissions";

const FORMATION_ROLES = new Set([
  "responsable_formation",
  "responsable_consultation",
  "directeur_general",
  "super_admin",
]);

async function hasFormationDepartmentAccess(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.FORMATION;
}

export async function assertFormationRead(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && FORMATION_ROLES.has(role)) return;
  if (await hasFormationDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["formation", "consultation"]);
  if (!perms.canRead) redirect("/access-denied");
}

export async function assertFormationWrite(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && FORMATION_ROLES.has(role)) return;
  if (await hasFormationDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["formation", "consultation"]);
  if (!perms.canCreate && !perms.canUpdate) redirect("/access-denied");
}

export async function canFormationDelete(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role && FORMATION_ROLES.has(role)) return true;
  if (await hasFormationDepartmentAccess(userId)) return true;
  const perms = await getModulePermissions(userId, ["formation", "consultation"]);
  return perms.canDelete;
}
