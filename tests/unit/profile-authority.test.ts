import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import {
  LEGACY_ROLE_TO_DEPARTMENT,
  buildProfileAuthoritySlice,
  resolveAuthorityDepartmentKey,
} from "@/lib/auth/profile-authority";

describe("profile-authority (role source lock)", () => {
  it("priorise department_key profil sur alias legacy", () => {
    expect(
      resolveAuthorityDepartmentKey("responsable_vente", DEPARTMENT_KEYS.FINANCE),
    ).toBe(DEPARTMENT_KEYS.FINANCE);
  });

  it("responsable_vente sans department_key → VENTE", () => {
    expect(resolveAuthorityDepartmentKey("responsable_vente", null)).toBe(
      DEPARTMENT_KEYS.VENTE,
    );
  });

  it("manager sans department_key → null (pas de magie SA)", () => {
    expect(resolveAuthorityDepartmentKey("manager", null)).toBeNull();
  });

  it("consultation normalisée → FORMATION pour navigation", () => {
    expect(resolveAuthorityDepartmentKey("manager", DEPARTMENT_KEYS.CONSULTATION)).toBe(
      DEPARTMENT_KEYS.FORMATION,
    );
  });

  it("détecte drift department_from_legacy_role_only", () => {
    const slice = buildProfileAuthoritySlice("responsable_vente", null);
    expect(slice.authorityDepartmentKey).toBe(DEPARTMENT_KEYS.VENTE);
    expect(slice.driftFlags).toContain("missing_department_key");
    expect(slice.driftFlags).toContain("department_from_legacy_role_only");
  });

  it("LEGACY_ROLE_TO_DEPARTMENT couvre les alias sidebar historiques", () => {
    expect(LEGACY_ROLE_TO_DEPARTMENT.responsable_vente).toBe(DEPARTMENT_KEYS.VENTE);
    expect(LEGACY_ROLE_TO_DEPARTMENT.comptable).toBe(DEPARTMENT_KEYS.FINANCE);
  });
});
