import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import { ROLE_KEYS } from "@/lib/auth/roles";
import { SUPER_ADMIN_COCKPIT_ROUTE } from "@/lib/navigation/erp-ux-architecture";
import {
  resolveEffectiveDepartmentKey,
  resolvePostLoginRoute,
} from "@/lib/navigation/home-route";
import { buildDepartmentSidebarGroups } from "@/lib/navigation/department-sidebar-nav";

describe("M3.5 UX P0 — home routes", () => {
  it("super_admin post-login → cockpit gouvernance /dashboard", () => {
    expect(resolvePostLoginRoute(ROLE_KEYS.SUPER_ADMIN, null)).toBe(SUPER_ADMIN_COCKPIT_ROUTE);
  });

  it("manager vente → cockpit département", () => {
    expect(resolvePostLoginRoute(ROLE_KEYS.MANAGER, DEPARTMENT_KEYS.VENTE)).toBe("/dept/vente");
  });

  it("consultation profile → formation cockpit (M1.5)", () => {
    expect(resolveEffectiveDepartmentKey(DEPARTMENT_KEYS.CONSULTATION)).toBe(
      DEPARTMENT_KEYS.FORMATION,
    );
    expect(resolvePostLoginRoute(ROLE_KEYS.MANAGER, DEPARTMENT_KEYS.CONSULTATION)).toBe(
      "/formation/dashboard",
    );
  });

  it("accountant → finance cockpit", () => {
    expect(resolvePostLoginRoute(ROLE_KEYS.ACCOUNTANT, null)).toBe("/dept/finance");
  });
});

describe("M3.5 UX P0 — Vente rail consolidation", () => {
  it("vente sidebar has Commerce + CRM groups under one department (not top-level duplicate modules)", () => {
    const groups = buildDepartmentSidebarGroups(DEPARTMENT_KEYS.VENTE);
    const ids = groups.map((g) => g.id);
    expect(ids).toContain("commerce");
    expect(ids).toContain("crm");
    expect(ids.filter((id) => id === "commerce" || id === "crm").length).toBe(2);
  });

  it("finance sidebar has single finance group", () => {
    const groups = buildDepartmentSidebarGroups(DEPARTMENT_KEYS.FINANCE);
    expect(groups.map((g) => g.id)).toEqual(["finance"]);
  });
});
