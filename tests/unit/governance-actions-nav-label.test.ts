import { describe, expect, it } from "vitest";
import { GOVERNANCE_ACTIONS_NAV } from "@/lib/actions/governance-nav";
import { NAV_CONFIG } from "@/lib/constants/nav-config";
import { ROUTES } from "@/lib/constants/routes";

describe("actions hub navigation (NAV_CONFIG source)", () => {
  it("sidebar has exactly 3 children without Vue d'ensemble", () => {
    const actions = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "actions");
    expect(actions?.children?.length).toBe(3);
    expect(actions?.children?.some((c) => c.label.includes("Vue d"))).toBe(false);
  });

  it("governance nav hub points to /actions", () => {
    const hub = GOVERNANCE_ACTIONS_NAV.find((x) => x.id === "hub");
    expect(hub?.href).toBe(ROUTES.actions);
    expect(hub?.label).toBe("Actions");
  });
});
