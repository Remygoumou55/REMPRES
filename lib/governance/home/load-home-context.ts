import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getProfileAuthBrief } from "@/lib/server/permissions";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";
import { getPostLoginDestination } from "@/lib/roleRedirects";
import { normalizeDepartmentKey } from "@/lib/departments/department-config";
import type { SupervisionScope } from "@/lib/auth/permissions";

export type GovernanceHomeContext = {
  userDisplayName: string;
  roleKey: string | null;
  departmentKey: string | null;
  supervisionScope: SupervisionScope;
};

async function loadBaseContext(): Promise<GovernanceHomeContext> {
  const user = await getServerSessionUser();
  if (!user) {
    redirect("/login");
  }

  const [brief, userDisplayName] = await Promise.all([
    getProfileAuthBrief(user.id),
    getCachedProfileDisplayName(user.id),
  ]);

  return {
    userDisplayName,
    roleKey: brief.roleKey,
    departmentKey: brief.departmentKey,
    supervisionScope: brief.supervisionScope,
  };
}

export async function getGovernanceHomeContext(): Promise<GovernanceHomeContext> {
  return loadBaseContext();
}

export async function getDepartmentGovernanceHomeContext(
  expectedDepartmentKey: string,
): Promise<GovernanceHomeContext> {
  const context = await loadBaseContext();
  const expected = normalizeDepartmentKey(expectedDepartmentKey);
  const current = normalizeDepartmentKey(context.departmentKey);

  if (current !== expected) {
    redirect(
      getPostLoginDestination(context.roleKey, context.departmentKey),
    );
  }

  return context;
}
