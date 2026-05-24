import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import { buildDepartmentSidebarGroups } from "@/lib/navigation/department-sidebar-nav";
import {
  FORBIDDEN_VENTE_TOP_LEVEL_MODULE_IDS,
  VENTE_DOMAIN_LABEL,
  VENTE_NAV_SUBGROUP_IDS,
  VENTE_ROUTE_PREFIX,
  validateVenteRailOwnership,
} from "@/lib/navigation/vente-rail-lock";

const ROOT = join(process.cwd());

function readSrc(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("M3.75 — DeptHomePage cockpit contract", () => {
  it("dept route utilise DeptHomePage + getDeptDashboardData", () => {
    const dept = readSrc("app/(app)/dept/[deptKey]/page.tsx");
    expect(dept).toContain("DeptHomePage");
    expect(dept).toContain("getDeptDashboardData");
    expect(dept).not.toContain("DepartmentDashboardPage");
    expect(dept).not.toContain("DepartmentCockpitPlaceholder");
  });

  it("DeptHomePage exige data DeptKpiData", () => {
    const src = readSrc("components/dashboard/dept-home-page.tsx");
    expect(src).toContain("DeptKpiData");
    expect(src).toMatch(/firstName:\s*string/);
  });
});

describe("M3.75 — Vente ownership M1.5 (domaine unique)", () => {
  it("domaine Vente = libellé officiel département (pas Commerce top-level)", () => {
    expect(VENTE_DOMAIN_LABEL).toBe("Vente");
  });

  it("sous-groupes Commerce + CRM sont repliables sous Vente, pas rails parallèles", () => {
    const groups = buildDepartmentSidebarGroups(DEPARTMENT_KEYS.VENTE);
    const report = validateVenteRailOwnership(groups);
    expect(report.valid).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.allHrefsUnderVente).toBe(true);
    expect(report.subgroupIds).toEqual([...VENTE_NAV_SUBGROUP_IDS]);
  });

  it("tous les liens Vente sont sous /vente", () => {
    const groups = buildDepartmentSidebarGroups(DEPARTMENT_KEYS.VENTE);
    const hrefs = groups.flatMap((g) => g.links.map((l) => l.href));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href.startsWith(VENTE_ROUTE_PREFIX)).toBe(true);
    }
  });

  it("AppShell métier n’utilise plus PrimarySidebar legacy ni SecondarySidebar", () => {
    const src = readSrc("components/layout/app-shell.tsx");
    expect(src).not.toContain("./app-shell/PrimarySidebar");
    expect(src).not.toContain("SecondarySidebarPanel");
    expect(src).not.toContain("./app-shell/MobileSidebar");
    expect(src).not.toContain("SuperAdminPrimarySidebar");
    expect(src).toContain("DepartmentBusinessSidebar");
    expect(src).toContain("ErpNavSidebar");
  });

  it("legacy ModuleId commerce/crm interdit comme rails top-level actifs", () => {
    expect(FORBIDDEN_VENTE_TOP_LEVEL_MODULE_IDS).toEqual(["commerce", "crm"]);
    const shell = readSrc("components/layout/app-shell.tsx");
    for (const id of FORBIDDEN_VENTE_TOP_LEVEL_MODULE_IDS) {
      expect(shell).not.toContain(`id: "${id}"`);
    }
  });
});

describe("M3.75 — Responsive shell structure (audit code)", () => {
  const shellSrc = () => readSrc("components/layout/app-shell.tsx");
  const sidebarSrc = () => readSrc("components/layout/app-shell/DepartmentBusinessSidebar.tsx");
  const cockpitSrc = () => readSrc("components/dashboard/dept-home-page.tsx");

  it("desktop: rail md:block + largeur repliable", () => {
    expect(shellSrc()).toContain("md:block");
    expect(shellSrc()).toMatch(/w-\[268px\]|w-\[76px\]/);
  });

  it("mobile: drawer md:hidden + menu hamburger", () => {
    expect(shellSrc()).toContain("md:hidden");
    expect(shellSrc()).toContain('aria-label="Ouvrir le menu"');
  });

  it("main: scroll contenu sans ghost overflow shell", () => {
    expect(shellSrc()).toContain("overflow-y-auto");
    expect(shellSrc()).toContain("min-h-0");
    expect(shellSrc()).toContain("overflow-hidden");
  });

  it("sidebar nav: overflow-y-auto overflow-x-hidden", () => {
    expect(sidebarSrc()).toContain("overflow-y-auto");
    expect(sidebarSrc()).toContain("overflow-x-hidden");
  });

  it("cockpit: grilles responsive sm/xl/lg", () => {
    expect(cockpitSrc()).toContain("sm:grid-cols-2");
    expect(cockpitSrc()).toMatch(/xl:grid-cols-\d/);
    expect(cockpitSrc()).toContain("lg:grid-cols-2");
  });

  it("super admin: ErpNavSidebar gelé (pas de cluster legacy SuperAdminPrimarySidebar)", () => {
    expect(shellSrc()).toContain("ErpNavSidebar");
    expect(shellSrc()).toContain("usesErpGlobalSidebar");
    expect(shellSrc()).not.toContain("SuperAdminPrimarySidebar");
    expect(shellSrc()).not.toContain("SuperAdminMobileNav");
  });
});

describe("M3.75 — Autres départements (échantillon lock)", () => {
  it("Finance: un groupe, routes /finance", () => {
    const groups = buildDepartmentSidebarGroups(DEPARTMENT_KEYS.FINANCE);
    expect(groups.map((g) => g.id)).toEqual(["finance"]);
    for (const href of groups.flatMap((g) => g.links.map((l) => l.href))) {
      expect(href.startsWith("/finance")).toBe(true);
    }
  });

  it("RH: un groupe, routes /rh", () => {
    const groups = buildDepartmentSidebarGroups(DEPARTMENT_KEYS.RH);
    expect(groups[0]?.id).toBe("rh");
    for (const href of groups.flatMap((g) => g.links.map((l) => l.href))) {
      expect(href.startsWith("/rh")).toBe(true);
    }
  });

  it("Formation: groupe unique incluant consultation (M1.5)", () => {
    const groups = buildDepartmentSidebarGroups(DEPARTMENT_KEYS.FORMATION);
    const hrefs = groups.flatMap((g) => g.links.map((l) => l.href));
    expect(hrefs.some((h) => h.includes("/consultation"))).toBe(true);
  });
});
