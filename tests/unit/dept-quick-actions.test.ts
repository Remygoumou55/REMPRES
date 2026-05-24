import { describe, expect, it } from "vitest";
import { getDeptQuickActions } from "@/lib/navigation/dept-quick-actions";

describe("getDeptQuickActions", () => {
  it("returns labeled actions (not raw URLs) for each department", () => {
    const depts = [
      "vente",
      "finance",
      "rh",
      "formation",
      "consultation",
      "marketing",
      "logistique",
    ] as const;

    for (const dept of depts) {
      const actions = getDeptQuickActions(dept);
      expect(actions.length).toBeGreaterThan(0);
      expect(actions.length).toBeLessThanOrEqual(6);
      for (const action of actions) {
        expect(action.label.length).toBeGreaterThan(2);
        expect(action.label).not.toMatch(/^\//);
        expect(action.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("includes official vente commerce shortcuts", () => {
    const labels = getDeptQuickActions("vente").map((a) => a.label);
    expect(labels).toContain("Nouvelle vente");
    expect(labels).toContain("Pipeline");
  });
});
