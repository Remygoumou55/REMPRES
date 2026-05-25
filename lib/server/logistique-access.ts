import { redirect } from "next/navigation";
import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { getModulePermissions, getProfileAuthBrief, getUserRole, isSuperAdmin } from "@/lib/server/permissions";

const LOGISTIQUE_ROLES = new Set([
  "responsable_logistique",
  "directeur_general",
  "super_admin",
  "manager",
]);

async function hasLogistiqueDepartmentAccess(userId: string): Promise<boolean> {
  const brief = await getProfileAuthBrief(userId);
  return normalizeDepartmentKey(brief.departmentKey) === DEPARTMENT_KEYS.LOGISTIQUE;
}

export async function assertLogistiqueRead(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && LOGISTIQUE_ROLES.has(role)) return;
  if (await hasLogistiqueDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["logistics", "logistique"]);
  if (!perms.canRead) redirect("/access-denied");
}

export async function assertLogistiqueWrite(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  const role = await getUserRole(userId);
  if (role && LOGISTIQUE_ROLES.has(role)) return;
  if (await hasLogistiqueDepartmentAccess(userId)) return;
  const perms = await getModulePermissions(userId, ["logistics", "logistique"]);
  if (!perms.canCreate && !perms.canUpdate) redirect("/access-denied");
}

export async function canLogistiqueDelete(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role && LOGISTIQUE_ROLES.has(role)) return true;
  if (await hasLogistiqueDepartmentAccess(userId)) return true;
  const perms = await getModulePermissions(userId, ["logistics", "logistique"]);
  return perms.canDelete;
}

export async function canLogistiqueApprove(userId: string): Promise<boolean> {
  if (await isSuperAdmin(userId)) return true;
  const role = await getUserRole(userId);
  if (role === "directeur_general" || role === "manager") return true;
  const perms = await getModulePermissions(userId, ["logistics", "logistique"]);
  return perms.canUpdate;
}
