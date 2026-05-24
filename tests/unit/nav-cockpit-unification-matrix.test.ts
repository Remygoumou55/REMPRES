import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import {
  COCKPIT_SURFACES,
  resolveCanonicalDeptCockpitPath,
  resolveCockpitSurfaceKind,
} from "@/lib/navigation/cockpit-authority";
import {
  DEPARTMENT_NAV_RUNTIME_SOURCES,
  NAVIGATION_AUTHORITY_VERSION,
  SUPER_ADMIN_NAV_RUNTIME_SOURCE,
  SUPER_ADMIN_NAV_VALIDATION_SOURCE,
  usesErpGlobalSidebar,
} from "@/lib/navigation/navigation-authority";
import { isOperationalHrefRoutable, resolvePlatformAdminHub } from "@/lib/navigation/platform-route-registry";
import { SHELL_RUNTIME } from "@/lib/navigation/shell-authority";
import { getSidebarForRole } from "@/lib/navigation/sidebar-for-role";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Nav + cockpit unification matrix — Bloc 2 Étape 3", () => {
  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "Navigation version",
      expected: NAVIGATION_AUTHORITY_VERSION,
      check: () => NAVIGATION_AUTHORITY_VERSION === "nav-cockpit-unification-v1",
    },
    {
      area: "SA nav source",
      expected: "nav-config",
      check: () => SUPER_ADMIN_NAV_RUNTIME_SOURCE.includes("nav-config"),
    },
    {
      area: "SA validation derived",
      expected: "super-admin-nav derived",
      check: () => SUPER_ADMIN_NAV_VALIDATION_SOURCE.includes("super-admin-nav"),
    },
    {
      area: "Dept nav builder",
      expected: "department-sidebar-nav",
      check: () => DEPARTMENT_NAV_RUNTIME_SOURCES.builder.includes("department-sidebar-nav"),
    },
    {
      area: "AppShell single layout",
      expected: SHELL_RUNTIME.layout,
      check: () => readSrc("app/(app)/layout.tsx").includes("AppShell"),
    },
    {
      area: "ErpNavSidebar frozen",
      expected: "unchanged",
      check: () => {
        const shell = readSrc("components/layout/app-shell.tsx");
        return shell.includes("ErpNavSidebar") && !shell.includes("SuperAdminPrimarySidebar");
      },
    },
    {
      area: "Dept cockpit",
      expected: "DeptHomePage /dept",
      check: () => resolveCockpitSurfaceKind("/dept/vente") === "department_home",
    },
    {
      area: "Finance operational",
      expected: "FinanceDashboardClient /finance",
      check: () => resolveCockpitSurfaceKind("/finance") === "finance_operational",
    },
    {
      area: "Finance dashboard redirect",
      expected: "legacy redirect",
      check: () => resolveCockpitSurfaceKind("/finance/dashboard") === "legacy_dashboard_redirect",
    },
    {
      area: "SA cockpit frozen",
      expected: COCKPIT_SURFACES.super_admin_frozen.frozen === true,
      check: () => COCKPIT_SURFACES.super_admin_frozen.uiComponent === "SuperAdminCockpitClient",
    },
    {
      area: "Shadow VenteCockpitClient",
      expected: "removed",
      check: () => !existsSync(join(ROOT, "modules/vente/components/cockpit/VenteCockpitClient.tsx")),
    },
    {
      area: "Platform AI hub",
      expected: "/admin/intelligence",
      check: () => resolvePlatformAdminHub("ai") === "/admin/intelligence",
    },
    {
      area: "Platform link routable",
      expected: "observability hub kept",
      check: () => isOperationalHrefRoutable(resolvePlatformAdminHub("observability")),
    },
    {
      area: "Sidebar SA mode",
      expected: "super_admin_erp",
      check: () =>
        getSidebarForRole({ isSuperAdmin: true, roleKey: "super_admin", departmentKey: null }).mode ===
        "super_admin_erp",
    },
    {
      area: "Sidebar dept mode",
      expected: "department_business",
      check: () =>
        usesErpGlobalSidebar(
          getSidebarForRole({
            isSuperAdmin: false,
            roleKey: "manager",
            departmentKey: DEPARTMENT_KEYS.VENTE,
          }).mode,
        ) === false,
    },
    {
      area: "Canonical dept cockpit path",
      expected: "/dept/vente",
      check: () =>
        resolveCanonicalDeptCockpitPath("manager", DEPARTMENT_KEYS.VENTE) === "/dept/vente",
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
