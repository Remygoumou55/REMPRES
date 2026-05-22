import { ROUTES } from "@/lib/constants/routes";
import { isArchivesGovernancePath } from "@/lib/archives/governance-nav";
import { isGovernanceActionsPath } from "@/lib/actions/governance-nav";
import { isSettingsGovernancePath } from "@/lib/settings/legacy-route-lock";
import {
  SUPER_ADMIN_NAV_GROUPS,
  SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS,
  type SuperAdminNavGroupDef,
} from "@/lib/navigation/super-admin-nav";
import { GOVERNANCE_ACTIONS_NAV } from "@/lib/actions/governance-nav";
import { ARCHIVES_GOVERNANCE_NAV } from "@/lib/archives/governance-nav";
import { SETTINGS_GOVERNANCE_NAV } from "@/lib/settings/governance-nav";

export const SUPER_ADMIN_HOME_ROUTE = ROUTES.home;

/** Modules métier interdits dans le rail super_admin. */
export const SUPER_ADMIN_FORBIDDEN_RAIL_MODULE_IDS = [
  "commerce",
  "crm",
  "finance",
  "rh",
  "logistics",
  "admin",
] as const;

export type GovernanceChromeBand = "settings" | "archives" | "actions" | null;

/**
 * Bandeau horizontal unique (Actions / Archives / Paramètres) — logique extraite pour tests.
 */
export function resolveGovernanceChromeBand(
  pathname: string,
  search: Pick<URLSearchParams, "get"> | null,
): GovernanceChromeBand {
  if (isSettingsGovernancePath(pathname)) return "settings";
  if (isArchivesGovernancePath(pathname, search)) return "archives";
  if (isGovernanceActionsPath(pathname)) return "actions";
  return null;
}

/** Vérifie que le rail officiel n’a pas dérivé (3 groupes, sources de nav alignées). */
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

  const actions = groups.find((g) => g.id === "actions");
  if (actions && actions.links.length !== GOVERNANCE_ACTIONS_NAV.length) {
    errors.push("actions links drift from GOVERNANCE_ACTIONS_NAV");
  }

  const archives = groups.find((g) => g.id === "archives");
  if (archives && archives.links.length !== ARCHIVES_GOVERNANCE_NAV.length) {
    errors.push("archives links drift from ARCHIVES_GOVERNANCE_NAV");
  }

  const settings = groups.find((g) => g.id === "settings");
  if (settings && settings.links.length !== SETTINGS_GOVERNANCE_NAV.length) {
    errors.push("settings links drift from SETTINGS_GOVERNANCE_NAV");
  }

  return { ok: errors.length === 0, errors };
}

/** Assertion runtime légère (tests + garde-fou import). */
export function assertSuperAdminNavLockdown(): void {
  const { ok, errors } = validateSuperAdminNavGroups(SUPER_ADMIN_NAV_GROUPS);
  if (!ok) {
    throw new Error(`Super admin nav lockdown failed: ${errors.join("; ")}`);
  }
}
