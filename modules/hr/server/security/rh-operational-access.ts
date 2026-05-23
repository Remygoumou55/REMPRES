import { getProfileAuthBrief, isAdminRole } from "@/lib/server/permissions";

export async function canOperateRhDomain(
  userId: string,
  perms: { canUpdate: boolean },
): Promise<boolean> {
  const [adminRole, brief] = await Promise.all([isAdminRole(userId), getProfileAuthBrief(userId)]);
  const isRhManager =
    String(brief.departmentKey ?? "").trim().toUpperCase() === "RH" &&
    String(brief.roleKey ?? "").trim().toLowerCase() === "manager";
  return adminRole || isRhManager || perms.canUpdate;
}
