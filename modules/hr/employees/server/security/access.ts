import { getModulePermissions, getProfileAuthBrief, isAdminRole } from "@/lib/server/permissions";

export async function assertCanReadEmployeeDomain(userId: string): Promise<boolean> {
  const perms = await getModulePermissions(userId, ["rh"]);
  return perms.canRead;
}

export async function canManageEmployeeDomain(userId: string): Promise<boolean> {
  const [adminRole, brief, perms] = await Promise.all([
    isAdminRole(userId),
    getProfileAuthBrief(userId),
    getModulePermissions(userId, ["rh"]),
  ]);
  const isRhManager =
    String(brief.departmentKey ?? "").trim().toUpperCase() === "RH" &&
    String(brief.roleKey ?? "").trim().toLowerCase() === "manager";
  return adminRole || isRhManager || perms.canUpdate;
}

