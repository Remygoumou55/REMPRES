import { ROUTES } from "@/lib/constants/routes";
import { isGovernanceActionsPath } from "@/lib/actions/governance-nav";
import { isSettingsGovernancePath } from "@/lib/settings/legacy-route-lock";
import {
  SUPER_ADMIN_NAV_GROUPS,
  SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS,
  type SuperAdminNavGroupDef,
} from "@/lib/navigation/navigation-authority";
import { NAV_CONFIG, findNavItemByKey } from "@/lib/constants/nav-config";

export const SUPER_ADMIN_HOME_ROUTE = ROUTES.home;

export const SUPER_ADMIN_FORBIDDEN_RAIL_MODULE_IDS = [
  "commerce",
  "crm",
  "finance",
  "rh",
  "logistics",
] as const;

export type GovernanceChromeBand = "settings" | "archives" | "actions" | null;

export function resolveGovernanceChromeBand(
  pathname: string,
  search: Pick<URLSearchParams, "get"> | null,
): GovernanceChromeBand {
  void search;
  if (isSettingsGovernancePath(pathname)) return "settings";
  if (isGovernanceActionsPath(pathname)) return "actions";
  return null;
}

const SIDEBAR_CHILD_COUNTS: Record<(typeof SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS)[number], number> = {
  actions: 2,
  archives: 7,
  admin: 8,
};

export function validateSuperAdminNavGroups(groups: readonly SuperAdminNavGroupDef[]): {
  ok: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const ids = groups.map((g) => g.id);

  if (groups.length !== SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS.length) {
    errors.push(`expected ${SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS.length} groups, got ${groups.length}`);
  }

  for (const expected of SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS) {
    if (!ids.includes(expected)) errors.push(`missing group: ${expected}`);
  }

  for (const id of ids) {
    if (!SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS.includes(id as (typeof SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS)[number])) {
      errors.push(`forbidden extra group: ${id}`);
    }
  }

  for (const group of groups) {
    const expectedCount = SIDEBAR_CHILD_COUNTS[group.id];
    if (group.links.length !== expectedCount) {
      errors.push(`${group.id} must have ${expectedCount} sidebar links, got ${group.links.length}`);
    }
  }

  const metierSection = NAV_CONFIG.find((s) => String(s.section) === "Métier");
  if (metierSection && metierSection.items.length > 0) {
    errors.push("Métier section must not exist in NAV_CONFIG");
  }

  const deptItem = findNavItemByKey("departements");
  if (!deptItem?.children || deptItem.children.length !== 7) {
    errors.push(`departements must have 7 children, got ${deptItem?.children?.length ?? 0}`);
  }

  const adminItem = findNavItemByKey("admin");
  if (!adminItem?.children || adminItem.children.length !== 8) {
    errors.push(`admin must have 8 children, got ${adminItem?.children?.length ?? 0}`);
  }

  const paramItem = findNavItemByKey("parametres");
  if (paramItem) {
    errors.push("parametres sidebar group must not exist after admin consolidation");
  }

  return { ok: errors.length === 0, errors };
}

export function assertSuperAdminNavLockdown(): void {
  const { ok, errors } = validateSuperAdminNavGroups(SUPER_ADMIN_NAV_GROUPS);
  if (!ok) {
    throw new Error(`Super admin nav lockdown failed: ${errors.join("; ")}`);
  }
}
