import { describe, expect, it } from "vitest";
import {
  evaluateImmutableRootMutation,
  MIN_ACTIVE_PLATFORM_ROOTS,
} from "@/lib/governance/runtime/immutable-root-policy";
import type { ProfileAuthoritySnapshot } from "@/lib/governance/runtime/root-protection";

const rootProfile: ProfileAuthoritySnapshot = {
  id: "root-1",
  role_key: "super_admin",
  system_authority: "ROOT",
  is_active: true,
  deleted_at: null,
};

describe("immutable root policy", () => {
  it("blocks deactivation of last platform root", () => {
    const result = evaluateImmutableRootMutation({
      before: rootProfile,
      intent: {
        targetUserId: rootProfile.id,
        nextRoleKey: "super_admin",
        nextDepartmentKey: null,
        nextIsActive: false,
      },
      activePlatformRoots: MIN_ACTIVE_PLATFORM_ROOTS,
      activeStrictRoots: MIN_ACTIVE_PLATFORM_ROOTS,
    });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("LAST_PLATFORM_ROOT");
  });

  it("blocks stripping ROOT authority from last strict root holder", () => {
    const result = evaluateImmutableRootMutation({
      before: rootProfile,
      intent: {
        targetUserId: rootProfile.id,
        nextRoleKey: "super_admin",
        nextDepartmentKey: null,
        nextSystemAuthority: "SUPER_ADMIN",
      },
      activePlatformRoots: 2,
      activeStrictRoots: MIN_ACTIVE_PLATFORM_ROOTS,
    });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("LAST_STRICT_ROOT_AUTHORITY");
  });

  it("blocks non-ROOT caller from granting ROOT", () => {
    const result = evaluateImmutableRootMutation({
      before: {
        id: "user-2",
        role_key: "manager",
        system_authority: "NONE",
        is_active: true,
        deleted_at: null,
      },
      intent: {
        targetUserId: "user-2",
        nextRoleKey: "super_admin",
        nextDepartmentKey: null,
        nextSystemAuthority: "ROOT",
      },
      activePlatformRoots: 2,
      activeStrictRoots: 2,
      callerUserId: "sa-1",
      callerSystemAuthority: "SUPER_ADMIN",
      callerRoleKey: "super_admin",
    });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("ROOT_GRANT_FORBIDDEN");
  });

  it("allows ROOT caller to grant ROOT when another root exists", () => {
    const result = evaluateImmutableRootMutation({
      before: {
        id: "user-2",
        role_key: "manager",
        system_authority: "NONE",
        is_active: true,
        deleted_at: null,
      },
      intent: {
        targetUserId: "user-2",
        nextRoleKey: "super_admin",
        nextDepartmentKey: null,
        nextSystemAuthority: "ROOT",
      },
      activePlatformRoots: 2,
      activeStrictRoots: 2,
      callerUserId: "root-1",
      callerSystemAuthority: "ROOT",
      callerRoleKey: "super_admin",
    });
    expect(result.allowed).toBe(true);
  });

  it("blocks self-demotion when last platform root", () => {
    const result = evaluateImmutableRootMutation({
      before: rootProfile,
      intent: {
        targetUserId: rootProfile.id,
        nextRoleKey: "manager",
        nextDepartmentKey: "VENTE",
        nextSystemAuthority: "NONE",
      },
      activePlatformRoots: MIN_ACTIVE_PLATFORM_ROOTS,
      activeStrictRoots: MIN_ACTIVE_PLATFORM_ROOTS,
      callerUserId: rootProfile.id,
      callerSystemAuthority: "ROOT",
    });
    expect(result.allowed).toBe(false);
    expect(result.code).toBe("SELF_ROOT_DEMOTION");
  });
});
