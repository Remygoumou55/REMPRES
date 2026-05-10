import { getModulePermissions } from "@/lib/server/permissions";
import { canManageEmployeeDomain } from "@/modules/hr/employees/server/security/access";

export async function assertCanReadContracts(userId: string): Promise<boolean> {
  const perms = await getModulePermissions(userId, ["rh"]);
  return perms.canRead;
}

export async function assertCanManageContracts(userId: string): Promise<boolean> {
  return canManageEmployeeDomain(userId);
}

