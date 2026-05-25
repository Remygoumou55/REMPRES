import { redirect } from "next/navigation";
import {
  DEPARTMENT_KEYS,
  normalizeDepartmentKey,
} from "@/lib/departments/department-config";
import {
  getModulePermissions,
  getProfileAuthBrief,
  getUserRole,
  isSuperAdmin,
} from "@/lib/server/permissions";

const MARKETING_ROLES = new Set([
  "responsable_marketing",
  "directeur_general",
  "super_admin",
  "manager",
]);

async function hasMarketingDepartmentAccess(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.MARKETING;
}

export async function assertMarketingRead(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && MARKETING_ROLES.has(role)) return;
  if (await hasMarketingDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["marketing"]);
  if (!perms.canRead) redirect("/access-denied");
}

export async function assertMarketingWrite(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && MARKETING_ROLES.has(role)) return;
  if (await hasMarketingDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["marketing"]);
  if (!perms.canCreate && !perms.canUpdate) redirect("/access-denied");
}

export async function canMarketingDelete(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role && MARKETING_ROLES.has(role)) return true;
  if (await hasMarketingDepartmentAccess(userId)) return true;
  const perms = await getModulePermissions(userId, ["marketing"]);
  return perms.canDelete;
}
