import { describe, expect, it } from "vitest";
import { NAV_CONFIG } from "@/lib/constants/nav-config";
import { ROUTES } from "@/lib/constants/routes";

describe("actions hub navigation (NAV_CONFIG source)", () => {
  it("has no Métier section", () => {
    expect(NAV_CONFIG.some((s) => s.section === "Métier")).toBe(false);
  });

  it("departements has 7 children and actions has 3 without Vue d'ensemble", () => {
    const dept = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "departements");
    expect(dept?.children?.length).toBe(7);
    const actions = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "actions");
    expect(actions?.children?.length).toBe(3);
    expect(actions?.children?.some((c) => c.label.includes("Vue d"))).toBe(false);
  });

  it("journaux points to /actions/journaux (distinct from admin journal)", () => {
    const journals = NAV_CONFIG.flatMap((s) => s.items)
      .find((i) => i.key === "actions")
      ?.children?.find((c) => c.key === "journaux");
    expect(journals?.href).toBe("/actions/journaux");
    const adminJournal = NAV_CONFIG.flatMap((s) => s.items)
      .find((i) => i.key === "admin")
      ?.children?.find((c) => c.key === "admin-journal");
    expect(adminJournal?.href).toBe("/admin/activity-logs");
    expect(journals?.href).not.toBe(adminJournal?.href);
  });

  it("parametres has no Utilisateurs child", () => {
    const param = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "parametres");
    expect(param?.children?.some((c) => c.label === "Utilisateurs")).toBe(false);
  });

  it("actions hub route is /actions", () => {
    const actions = NAV_CONFIG.flatMap((s) => s.items).find((i) => i.key === "actions");
    expect(actions?.href).toBe(ROUTES.actions);
  });
});
