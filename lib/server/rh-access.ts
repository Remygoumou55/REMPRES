import { redirect } from "next/navigation";
import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { getModulePermissions, getProfileAuthBrief, getUserRole, isSuperAdmin } from "@/lib/server/permissions";

const RH_ROLES = new Set(["responsable_rh", "directeur_general", "super_admin", "manager"]);

async function hasRhDepartmentAccess(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.RH;
}

export async function assertRhRead(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && RH_ROLES.has(role)) return;
  if (await hasRhDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["rh"]);
  if (!perms.canRead) redirect("/access-denied");
}

export async function assertRhWrite(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && RH_ROLES.has(role)) return;
  if (await hasRhDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["rh"]);
  if (!perms.canCreate && !perms.canUpdate) redirect("/access-denied");
}

export async function canRhDelete(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role && RH_ROLES.has(role)) return true;
  if (await hasRhDepartmentAccess(userId)) return true;
  const perms = await getModulePermissions(userId, ["rh"]);
  return perms.canDelete;
}

export async function canRhManageLeaves(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role && RH_ROLES.has(role)) return true;
  if (await hasRhDepartmentAccess(userId)) return true;
  const perms = await getModulePermissions(userId, ["rh"]);
  return perms.canUpdate;
}
