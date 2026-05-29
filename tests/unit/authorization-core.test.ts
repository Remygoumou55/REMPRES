import { describe, expect, it } from "vitest";
import {
  canAccessRoute,
  hasSystemAuthority,
  resolveAuthenticatedLanding,
  resolveAuthenticatedSafeHome,
  toPlatformAuthorityProfile,
} from "@/lib/auth/authorization-core";
import { canAccessPathForProfile } from "@/lib/auth/permissions";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";

describe("authorization-core — ROOT with business role_key", () => {
  const rootManager = toPlatformAuthorityProfile({
    roleKey: "manager",
    systemAuthority: "ROOT",
    departmentKey: DEPARTMENT_KEYS.VENTE,
  });

  it("hasSystemAuthority when system_authority is ROOT", () => {
    expect(hasSystemAuthority(rootManager)).toBe(true);
  });

  it("lands on super admin cockpit", () => {
    expect(resolveAuthenticatedLanding(rootManager)).toBe("/dashboard");
  });

  it("safe home is cockpit not /actions", () => {
    expect(resolveAuthenticatedSafeHome(rootManager)).toBe("/dashboard");
  });

  it("allows governance dashboard via canAccessRoute", () => {
    expect(canAccessRoute("/dashboard", rootManager)).toBe(true);
    expect(canAccessRoute("/settings/users", rootManager)).toBe(true);
  });

  it("denies operational vente write paths", () => {
    expect(canAccessRoute("/vente/nouvelle-vente", rootManager)).toBe(false);
    expect(canAccessRoute("/finance", rootManager)).toBe(false);
  });

  it("aligns with canAccessPathForProfile when system_authority passed", () => {
    expect(
      canAccessPathForProfile(
        "/archives",
        rootManager.roleKey,
        rootManager.departmentKey,
        rootManager.systemAuthority,
      ),
    ).toBe(true);
    expect(
      canAccessPathForProfile(
        "/archives",
        rootManager.roleKey,
        rootManager.departmentKey,
        null,
      ),
    ).toBe(false);
  });

  it("allows /profil for any authenticated profile shape", () => {
    expect(canAccessRoute("/profil", rootManager)).toBe(true);
    expect(
      canAccessRoute(
        "/profil",
        toPlatformAuthorityProfile({
          roleKey: "agent",
          systemAuthority: "NONE",
          departmentKey: DEPARTMENT_KEYS.VENTE,
        }),
      ),
    ).toBe(true);
  });
});
