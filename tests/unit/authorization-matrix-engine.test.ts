import { describe, expect, it } from "vitest";
import {
  canAccessRoute,
  canExecuteAction,
  resolveMatrixScope,
  toPlatformAuthorityProfile,
} from "@/lib/auth/authorization-core";
import {
  createSyncMatrixEngine,
  matrixCanAccessRoute,
  matrixCanExecuteAction,
} from "@/lib/auth/authorization-matrix-engine";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";

describe("authorization-matrix-engine", () => {
  const rootManager = toPlatformAuthorityProfile({
    roleKey: "manager",
    systemAuthority: "ROOT",
    departmentKey: DEPARTMENT_KEYS.VENTE,
  });

  const venteManager = toPlatformAuthorityProfile({
    roleKey: "manager",
    systemAuthority: "NONE",
    departmentKey: DEPARTMENT_KEYS.VENTE,
  });

  it("resolveMatrixScope — control plane sans département métier", () => {
    const scope = resolveMatrixScope(rootManager);
    expect(scope.departmentKey).toBeNull();
    expect(scope.routePrefixes).toContain("/dashboard");
    expect(scope.actions).toContain("user.admin.update");
  });

  it("resolveMatrixScope — business plane avec modules déduits", () => {
    const scope = resolveMatrixScope(venteManager);
    expect(scope.departmentKey).toBe(DEPARTMENT_KEYS.VENTE);
    expect(scope.moduleKeys).toContain("clients");
    expect(scope.routePrefixes.some((p) => p.startsWith("/vente"))).toBe(true);
  });

  it("matrix et core alignés sur routes", () => {
    expect(matrixCanAccessRoute("/dashboard", rootManager)).toBe(true);
    expect(canAccessRoute("/dashboard", rootManager)).toBe(true);
    expect(matrixCanAccessRoute("/vente/nouvelle-vente", rootManager)).toBe(false);
    expect(canAccessRoute("/vente/nouvelle-vente", rootManager)).toBe(false);
  });

  it("ROOT peut gérer utilisateurs, pas mutations vente", () => {
    expect(matrixCanExecuteAction("user.admin.update", rootManager)).toBe(true);
    expect(matrixCanExecuteAction("vente.operational.mutate", rootManager)).toBe(false);
    expect(canExecuteAction("user.admin.update", rootManager)).toBe(true);
    expect(canExecuteAction("vente.operational.mutate", rootManager)).toBe(false);
  });

  it("manager VENTE peut opérer vente, pas admin users", () => {
    expect(matrixCanExecuteAction("vente.operational.mutate", venteManager)).toBe(true);
    expect(matrixCanExecuteAction("user.admin.update", venteManager)).toBe(false);
  });

  it("manager ADMINISTRATION peut décider approbations", () => {
    const dg = toPlatformAuthorityProfile({
      roleKey: "manager",
      systemAuthority: "NONE",
      departmentKey: DEPARTMENT_KEYS.ADMINISTRATION,
    });
    expect(matrixCanExecuteAction("approval.decide", dg)).toBe(true);
  });

  it("createSyncMatrixEngine expose API cohérente", () => {
    const engine = createSyncMatrixEngine(rootManager);
    expect(engine.resolveScope().departmentKey).toBeNull();
    expect(engine.canAccessRoute("/settings/users")).toBe(true);
    expect(engine.canExecuteAction("finance.expense.mutate")).toBe(false);
  });

  it("module.read avec permissions", () => {
    expect(
      matrixCanExecuteAction("module.read", venteManager, {
        moduleKey: "clients",
        modulePermissions: {
          canRead: true,
          canCreate: false,
          canUpdate: false,
          canDelete: false,
        },
      }),
    ).toBe(true);
  });
});
