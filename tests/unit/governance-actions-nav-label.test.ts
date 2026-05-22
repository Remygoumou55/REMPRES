import { describe, expect, it } from "vitest";
import { GOVERNANCE_ACTIONS_NAV } from "@/lib/actions/governance-nav";
import { SUPER_ADMIN_NAV_GROUPS } from "@/lib/navigation/super-admin-nav";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { ROUTES } from "@/lib/constants/routes";

describe("actions hub navigation label (no duplicate identity)", () => {
  it("uses single official label for /actions across governance nav and constants", () => {
    const hub = GOVERNANCE_ACTIONS_NAV.find((x) => x.id === "hub");
    expect(hub?.href).toBe(ROUTES.actions);
    expect(hub?.label).toBe(NAV_LABELS.actionsOverview);
    expect(hub?.label).toBe("Vue d'ensemble");
  });

  it("matches super_admin Actions group first link", () => {
    const actionsGroup = SUPER_ADMIN_NAV_GROUPS.find((g) => g.id === "actions");
    const first = actionsGroup?.links[0];
    expect(first?.href).toBe(ROUTES.actions);
    expect(first?.label).toBe(NAV_LABELS.actionsOverview);
  });
});
