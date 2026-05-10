import { getModulePermissions } from "@/lib/server/permissions";
import { canManageEmployeeDomain } from "@/modules/hr/employees/server/security/access";

export async function assertCanReadRecruitment(userId: string): Promise<boolean> {
  const perms = await getModulePermissions(userId, ["rh"]);
  return perms.canRead;
}

export async function assertCanManageRecruitment(userId: string): Promise<boolean> {
  return canManageEmployeeDomain(userId);
}
