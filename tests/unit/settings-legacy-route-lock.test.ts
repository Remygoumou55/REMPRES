import { describe, expect, it } from "vitest";
import {
  isAllowedAdminGovernancePath,
  isBlockedLegacyAdminPath,
  resolveSettingsGovernanceRedirect,
  resolveSettingsLegacyAliasRedirect,
} from "@/lib/settings/legacy-route-lock";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";
import { canAccessPathForProfile } from "@/lib/auth/permissions";

describe("settings legacy route lock", () => {
  it("redirige les alias Paramètres vers les routes officielles", () => {
    expect(resolveSettingsLegacyAliasRedirect("/config")).toBe(SETTINGS_OFFICIAL_ROUTES.permissions);
    expect(resolveSettingsLegacyAliasRedirect("/admin/users")).toBe(SETTINGS_OFFICIAL_ROUTES.users);
    expect(resolveSettingsLegacyAliasRedirect("/admin/currency")).toBe(SETTINGS_OFFICIAL_ROUTES.rates);
    expect(resolveSettingsLegacyAliasRedirect("/admin")).toBe(SETTINGS_OFFICIAL_ROUTES.hub);
  });

  it("bloque les routes admin legacy non gouvernées", () => {
    expect(isBlockedLegacyAdminPath("/admin/ai")).toBe(true);
    expect(isBlockedLegacyAdminPath("/admin/cloud")).toBe(true);
    expect(isBlockedLegacyAdminPath("/admin/multitenant")).toBe(true);
    expect(resolveSettingsGovernanceRedirect("/admin/ai")).toBe(SETTINGS_OFFICIAL_ROUTES.hub);
  });

  it("conserve Actions et Archives sous /admin", () => {
    expect(isAllowedAdminGovernancePath("/admin/approvals")).toBe(true);
    expect(isAllowedAdminGovernancePath("/admin/activity-logs")).toBe(true);
    expect(isAllowedAdminGovernancePath("/admin/archives")).toBe(true);
    expect(isBlockedLegacyAdminPath("/admin/approvals")).toBe(false);
    expect(isBlockedLegacyAdminPath("/admin/audit")).toBe(false);
  });

  it("refuse super_admin sur admin legacy IA", () => {
    expect(canAccessPathForProfile("/admin/ai", "super_admin", null)).toBe(false);
    expect(canAccessPathForProfile("/settings/users", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/admin/users", "super_admin", null)).toBe(true);
  });
});
