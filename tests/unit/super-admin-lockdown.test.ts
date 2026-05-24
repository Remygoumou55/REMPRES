import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/constants/routes";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";
import {
  SUPER_ADMIN_NAV_GROUPS,
  SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS,
  getSuperAdminNavSegment,
} from "@/lib/navigation/navigation-authority";
import {
  SUPER_ADMIN_FORBIDDEN_RAIL_MODULE_IDS,
  SUPER_ADMIN_HOME_ROUTE,
  assertSuperAdminNavLockdown,
  resolveGovernanceChromeBand,
  validateSuperAdminNavGroups,
} from "@/lib/navigation/super-admin-lockdown";

describe("super admin final lockdown", () => {
  it("verrouille le rail officiel (3 groupes collapsibles dérivés de NAV_CONFIG)", () => {
    expect(SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS).toEqual(["actions", "archives", "admin"]);
    expect(SUPER_ADMIN_HOME_ROUTE).toBe(ROUTES.home);
    const { ok, errors } = validateSuperAdminNavGroups(SUPER_ADMIN_NAV_GROUPS);
    expect(errors).toEqual([]);
    expect(ok).toBe(true);
    expect(() => assertSuperAdminNavLockdown()).not.toThrow();
  });

  it("interdit les modules métier dans la définition rail", () => {
    const forbidden = new Set(SUPER_ADMIN_FORBIDDEN_RAIL_MODULE_IDS);
    for (const group of SUPER_ADMIN_NAV_GROUPS) {
      expect(forbidden.has(group.id as (typeof SUPER_ADMIN_FORBIDDEN_RAIL_MODULE_IDS)[number])).toBe(false);
    }
  });

  it("résout le segment Accueil sur /dashboard", () => {
    expect(getSuperAdminNavSegment(ROUTES.home, null)).toBe("dashboard");
    expect(getSuperAdminNavSegment(`${ROUTES.home}/executive`, null)).toBe("dashboard");
  });

  it("sépare Actions, Archives et Admin (segments distincts)", () => {
    expect(getSuperAdminNavSegment(ROUTES.actions, null)).toBe("actions");
    expect(getSuperAdminNavSegment("/admin/approvals", null)).toBe("actions");
    expect(getSuperAdminNavSegment(ROUTES.archives, null)).toBe("archives");
    expect(getSuperAdminNavSegment("/admin/archives", null)).toBe("archives");
    expect(getSuperAdminNavSegment(SETTINGS_OFFICIAL_ROUTES.hub, null)).toBe("admin");
    expect(getSuperAdminNavSegment(SETTINGS_OFFICIAL_ROUTES.users, null)).toBe("admin");
    expect(getSuperAdminNavSegment("/dept/vente", null)).toBe("departements");
  });

  it("marque les chemins admin legacy non gouvernés comme unmapped", () => {
    expect(getSuperAdminNavSegment("/admin/ai", null)).toBe("unmapped");
    expect(getSuperAdminNavSegment("/admin/cloud", null)).toBe("unmapped");
  });

  it("résout un bandeau GovernanceChrome exclusif par priorité settings > archives > actions", () => {
    expect(resolveGovernanceChromeBand(SETTINGS_OFFICIAL_ROUTES.security, null)).toBe("settings");
    expect(resolveGovernanceChromeBand(ROUTES.archives, null)).toBe(null);
    expect(resolveGovernanceChromeBand("/admin/archives", null)).toBe(null);
    expect(resolveGovernanceChromeBand(ROUTES.actions, null)).toBe("actions");
    expect(resolveGovernanceChromeBand("/admin/approvals", null)).toBe("actions");
    expect(resolveGovernanceChromeBand(ROUTES.home, null)).toBe(null);
    expect(resolveGovernanceChromeBand("/vente/clients", null)).toBe(null);
  });

  it("ne mélange pas Paramètres et Actions sur le bandeau", () => {
    const settingsBand = resolveGovernanceChromeBand(SETTINGS_OFFICIAL_ROUTES.permissions, null);
    const actionsBand = resolveGovernanceChromeBand("/admin/audit", null);
    expect(settingsBand).toBe("settings");
    expect(actionsBand).toBe("actions");
    expect(settingsBand).not.toBe(actionsBand);
  });
});
