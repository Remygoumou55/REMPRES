import { describe, expect, it } from "vitest";
import {
  hasSystemRootAuthority,
  normalizeSystemAuthority,
  resolveEffectivePlatformRoleKey,
} from "@/lib/auth/system-authority";
import { coerceRootProfilePatch } from "@/lib/governance/runtime/root-protection";
import { ROLE_KEYS } from "@/lib/auth/roles";

describe("system authority layer", () => {
  it("recognizes ROOT and super_admin role variants", () => {
    expect(hasSystemRootAuthority({ roleKey: "super_admin", systemAuthority: "NONE" })).toBe(
      true,
    );
    expect(hasSystemRootAuthority({ roleKey: "manager", systemAuthority: "ROOT" })).toBe(true);
    expect(hasSystemRootAuthority({ roleKey: "superadmin", systemAuthority: null })).toBe(true);
    expect(hasSystemRootAuthority({ roleKey: "manager", systemAuthority: "NONE" })).toBe(false);
  });

  it("promotes platform role when system authority is ROOT", () => {
    expect(
      resolveEffectivePlatformRoleKey("manager", "ROOT"),
    ).toBe(ROLE_KEYS.SUPER_ADMIN);
  });

  it("coerces super_admin patch without department", () => {
    const patch = coerceRootProfilePatch({
      role_key: "super_admin",
      department_key: "VENTE",
      system_authority: "NONE",
    });
    expect(patch.role_key).toBe("super_admin");
    expect(patch.department_key).toBeNull();
    expect(normalizeSystemAuthority(patch.system_authority)).toBe("SUPER_ADMIN");
  });
});
