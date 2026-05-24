import { describe, expect, it } from "vitest";
import {
  canAccessPathForProfile,
  hasAdminConsoleAccess,
  isSuperAdminOperationalBlocked,
} from "@/lib/auth/permissions";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";

describe("hasAdminConsoleAccess", () => {
  it("always allows super_admin regardless of department field", () => {
    expect(hasAdminConsoleAccess("super_admin", null)).toBe(true);
    expect(hasAdminConsoleAccess("super_admin", DEPARTMENT_KEYS.VENTE)).toBe(true);
  });

  it("allows manager in ADMINISTRATION only", () => {
    expect(hasAdminConsoleAccess("manager", DEPARTMENT_KEYS.ADMINISTRATION)).toBe(true);
    expect(hasAdminConsoleAccess("manager", DEPARTMENT_KEYS.VENTE)).toBe(false);
  });

  it("resolves legacy DG alias to manager for administration access", () => {
    expect(hasAdminConsoleAccess("directeur_general", DEPARTMENT_KEYS.ADMINISTRATION)).toBe(true);
    expect(hasAdminConsoleAccess("directeur_general", null)).toBe(true);
  });

  it("denies legacy responsable_vente cross-dept cockpit paths", () => {
    expect(
      canAccessPathForProfile("/dept/finance", "responsable_vente", null),
    ).toBe(false);
    expect(
      canAccessPathForProfile("/dept/rh", "responsable_vente", null),
    ).toBe(false);
  });
});

describe("isSuperAdminOperationalBlocked", () => {
  it("blocks canonical super_admin operational mutations", () => {
    expect(isSuperAdminOperationalBlocked("super_admin")).toBe(true);
  });

  it("does not block operational staff", () => {
    expect(isSuperAdminOperationalBlocked("agent")).toBe(false);
    expect(isSuperAdminOperationalBlocked("manager")).toBe(false);
  });
});

describe("canAccessPathForProfile — cross-department & super_admin governance isolation", () => {
  it("denies vente manager access to finance routes", () => {
    expect(
      canAccessPathForProfile("/finance", "manager", DEPARTMENT_KEYS.VENTE),
    ).toBe(false);
    expect(
      canAccessPathForProfile("/finance/depenses", "manager", DEPARTMENT_KEYS.VENTE),
    ).toBe(false);
  });

  it("allows vente manager full vente subtree including historique", () => {
    expect(
      canAccessPathForProfile("/vente/historique", "manager", DEPARTMENT_KEYS.VENTE),
    ).toBe(true);
    expect(
      canAccessPathForProfile("/vente/nouvelle-vente", "manager", DEPARTMENT_KEYS.VENTE),
    ).toBe(true);
  });

  it("allows dept cockpit paths for matching department profiles", () => {
    expect(
      canAccessPathForProfile("/dept/vente", "manager", DEPARTMENT_KEYS.VENTE),
    ).toBe(true);
    expect(
      canAccessPathForProfile("/dept/finance", "manager", DEPARTMENT_KEYS.VENTE),
    ).toBe(false);
    expect(
      canAccessPathForProfile("/dept/finance", "accountant", DEPARTMENT_KEYS.FINANCE),
    ).toBe(true);
    expect(
      canAccessPathForProfile("/dept/vente", "responsable_vente", null),
    ).toBe(true);
    expect(canAccessPathForProfile("/dept/vente", "super_admin", null)).toBe(true);
  });

  it("blocks super_admin from operational vente routes but allows read-only supervision paths", () => {
    expect(
      canAccessPathForProfile("/vente/nouvelle-vente", "super_admin", null),
    ).toBe(false);
    expect(
      canAccessPathForProfile("/vente/clients", "super_admin", null),
    ).toBe(false);
    expect(
      canAccessPathForProfile("/vente/produits/new", "super_admin", null),
    ).toBe(false);
    expect(canAccessPathForProfile("/vente/historique", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/vente/clients/archives", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/vente/recu/x", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/finance", "super_admin", null)).toBe(false);
    expect(canAccessPathForProfile("/rh", "super_admin", null)).toBe(false);
    expect(canAccessPathForProfile("/dashboard", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/settings/permissions", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/admin/users", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/actions", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/archives", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/config", "super_admin", null)).toBe(true);
    expect(canAccessPathForProfile("/admin/ai", "super_admin", null)).toBe(false);
  });

  it("restricts auditor to activity logs + dashboard shell", () => {
    expect(
      canAccessPathForProfile("/admin/activity-logs", "auditor", DEPARTMENT_KEYS.AUDIT),
    ).toBe(true);
    expect(canAccessPathForProfile("/admin/users", "auditor", DEPARTMENT_KEYS.AUDIT)).toBe(
      false,
    );
    expect(canAccessPathForProfile("/vente/historique", "auditor", null)).toBe(false);
  });

  it("allows accountant finance subtree", () => {
    expect(
      canAccessPathForProfile("/finance/depenses", "accountant", DEPARTMENT_KEYS.FINANCE),
    ).toBe(true);
    expect(
      canAccessPathForProfile("/vente/historique", "accountant", DEPARTMENT_KEYS.FINANCE),
    ).toBe(false);
  });
});
