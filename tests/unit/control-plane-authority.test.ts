import { describe, expect, it } from "vitest";
import {
  isControlPlaneActor,
  resolveAuthorityPlane,
  resolveNavigationContext,
  resolveShellDepartmentKey,
} from "@/lib/auth/control-plane-authority";
import { resolveAuthorityDepartmentKey } from "@/lib/auth/profile-authority";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import {
  resolveAuthorityScope,
  toPlatformAuthorityProfile,
} from "@/lib/auth/authorization-core";

describe("control-plane-authority", () => {
  it("ROOT avec role_key métier reste control plane", () => {
    const slice = { roleKey: "manager", systemAuthority: "ROOT" };
    expect(isControlPlaneActor(slice)).toBe(true);
    expect(resolveAuthorityPlane(slice)).toBe("control");
  });

  it("super_admin legacy sans system_authority est control plane", () => {
    expect(isControlPlaneActor({ roleKey: "super_admin", systemAuthority: null })).toBe(true);
  });

  it("manager VENTE sans autorité système est business", () => {
    const slice = { roleKey: "manager", systemAuthority: "NONE" };
    expect(resolveAuthorityPlane(slice)).toBe("business");
  });

  it("ne dérive pas de département métier pour ROOT", () => {
    expect(
      resolveAuthorityDepartmentKey("manager", DEPARTMENT_KEYS.VENTE, "ROOT"),
    ).toBeNull();
  });

  it("super_admin ne mappe plus vers ADMINISTRATION", () => {
    expect(resolveAuthorityDepartmentKey("super_admin", null, null)).toBeNull();
  });

  it("shellDepartmentKey null en control plane même si DB a un dept", () => {
    expect(
      resolveShellDepartmentKey(
        { roleKey: "manager", systemAuthority: "ROOT" },
        DEPARTMENT_KEYS.VENTE,
      ),
    ).toBeNull();
  });

  it("resolveNavigationContext marque businessDepartmentKey null", () => {
    const ctx = resolveNavigationContext({ roleKey: "super_admin", systemAuthority: "SUPER_ADMIN" });
    expect(ctx.plane).toBe("control");
    expect(ctx.isControlPlane).toBe(true);
    expect(ctx.businessDepartmentKey).toBeNull();
  });

  it("resolveAuthorityScope expose plane control", () => {
    const scope = resolveAuthorityScope(
      toPlatformAuthorityProfile({
        roleKey: "manager",
        systemAuthority: "ROOT",
        departmentKey: DEPARTMENT_KEYS.VENTE,
      }),
    );
    expect(scope.isControlPlane).toBe(true);
    expect(scope.plane).toBe("control");
  });
});
