import { describe, expect, it } from "vitest";
import { ROLE_KEYS } from "@/lib/auth/roles";
import { getGovernanceHomeModel } from "@/lib/governance/home-config";

describe("governance home config", () => {
  it("returns supervision-only restrictions for super admin", () => {
    const model = getGovernanceHomeModel({
      roleKey: ROLE_KEYS.SUPER_ADMIN,
      departmentKey: "ADMINISTRATION",
      supervisionScope: "global",
    });

    expect(model.title).toContain("gouvernance");
    expect(model.restrictedActions.join(" ")).toContain("mutations");
    expect(model.allowedActions.length).toBeGreaterThan(0);
  });

  it("returns department-scoped content for managers", () => {
    const model = getGovernanceHomeModel({
      roleKey: ROLE_KEYS.MANAGER,
      departmentKey: "VENTE",
      supervisionScope: "departmental",
    });

    expect(model.title).toContain("Vente");
    expect(model.allowedActions.join(" ")).toContain("clients");
    expect(model.restrictedActions.length).toBeGreaterThan(0);
  });
});
