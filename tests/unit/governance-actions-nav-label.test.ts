import { describe, expect, it } from "vitest";
import { NAV_CONFIG } from "@/lib/constants/nav-config";
import { ROUTES } from "@/lib/constants/routes";

describe("actions hub navigation (NAV_CONFIG source)", () => {
  it("has no Métier section", () => {
    expect(NAV_CONFIG.some((s) => s.section === "Métier")).toBe(false);
  });

  it("departements has 6 children and actions has Utilisateurs without Vue d'ensemble", () => {
    const dept = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "departements");
    expect(dept?.children?.length).toBe(6);
    const actions = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "actions");
    expect(actions?.children?.length).toBe(3);
    expect(actions?.children?.some((c) => c.key === "utilisateurs")).toBe(true);
    expect(actions?.children?.some((c) => c.label.includes("Vue d"))).toBe(false);
  });

  it("admin journal points to activity logs", () => {
    const adminJournal = NAV_CONFIG.flatMap((s) => s.items)
      .find((i) => i.key === "admin")
      ?.children?.find((c) => c.key === "admin-journal");
    expect(adminJournal?.href).toBe("/admin/activity-logs");
  });

  it("admin consolidates settings and has Utilisateurs once", () => {
    expect(NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "parametres")).toBeUndefined();
    const admin = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "admin");
    expect(admin?.children?.length).toBe(8);
    expect(admin?.children?.filter((c) => c.label === "Utilisateurs").length).toBe(1);
  });

  it("actions hub route is /actions", () => {
    const actions = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "actions");
    expect(actions?.href).toBe(ROUTES.actions);
  });
});
