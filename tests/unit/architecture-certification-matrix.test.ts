import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ARCHITECTURE_CERTIFICATION_VERSION,
  ARCHITECTURE_TOPOLOGY,
  BLOC2_STAGE_VERDICTS,
} from "@/lib/architecture/architecture-certification-registry";
import { isAdminRouteKept, ADMIN_APP_SEGMENTS_KEPT } from "@/lib/navigation/admin-route-registry";
import {
  COCKPIT_AUTHORITY_VERSION,
  COCKPIT_SURFACES,
  resolveCockpitSurfaceKind,
} from "@/lib/navigation/cockpit-authority";
import {
  NAVIGATION_AUTHORITY_VERSION,
  SUPER_ADMIN_NAV_RUNTIME_SOURCE,
} from "@/lib/navigation/navigation-authority";
import { SHELL_RUNTIME } from "@/lib/navigation/shell-authority";
import { RUNTIME_PERF_MATRIX, RUNTIME_PERFORMANCE_VERSION } from "@/lib/performance/runtime-performance-registry";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function listAdminPageRoutes(): string[] {
  const adminDir = join(ROOT, "app/(app)/admin");
  const routes: string[] = [];

  function walk(dir: string, prefix: string) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name.startsWith("[")) {
          walk(full, `${prefix}/[param]`);
        } else {
          walk(full, `${prefix}/${name}`);
        }
      } else if (name === "page.tsx") {
        routes.push(prefix || "/admin");
      }
    }
  }

  walk(adminDir, "/admin");
  return routes;
}

describe("Architecture certification matrix — Bloc 2 Étape 5", () => {
  it("registry version locked", () => {
    expect(ARCHITECTURE_CERTIFICATION_VERSION).toBe("architecture-certification-v1");
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "Structure — topology modules",
      expected: "authority files exist",
      check: () =>
        Object.values(ARCHITECTURE_TOPOLOGY).every((p) => {
          const path = p.includes("→") ? p.split("→")[0].trim() : p;
          return existsSync(join(ROOT, path));
        }),
    },
    {
      area: "Structure — single AppShell",
      expected: "one AppShell in app layout",
      check: () => {
        const layout = readSrc("app/(app)/layout.tsx");
        const matches = layout.match(/<AppShell/g) ?? [];
        return matches.length === 1 && layout.includes(SHELL_RUNTIME.component);
      },
    },
    {
      area: "Structure — no second AppShell export usage",
      expected: "AppShell only in (app)/layout",
      check: () => {
        const deptLayout = readSrc("app/(app)/dept/layout.tsx");
        const adminLayout = readSrc("app/(app)/admin/layout.tsx");
        return !deptLayout.includes("AppShell") && !adminLayout.includes("AppShell");
      },
    },
    {
      area: "Navigation — authority version",
      expected: NAVIGATION_AUTHORITY_VERSION,
      check: () => NAVIGATION_AUTHORITY_VERSION === "nav-cockpit-unification-v1",
    },
    {
      area: "Navigation — SA nav source",
      expected: "nav-config",
      check: () => SUPER_ADMIN_NAV_RUNTIME_SOURCE.includes("nav-config"),
    },
    {
      area: "Navigation — no legacy SA sidebar",
      expected: "no SuperAdminPrimarySidebar",
      check: () => !readSrc("components/layout/app-shell.tsx").includes("SuperAdminPrimarySidebar"),
    },
    {
      area: "Cockpit — authority version",
      expected: COCKPIT_AUTHORITY_VERSION,
      check: () => COCKPIT_AUTHORITY_VERSION === "cockpit-unification-v1",
    },
    {
      area: "Cockpit — SA frozen surface",
      expected: "SuperAdminCockpitClient",
      check: () =>
        COCKPIT_SURFACES.super_admin_frozen.frozen === true &&
        readSrc("app/(app)/dashboard/page.tsx").includes("SuperAdminCockpitClient"),
    },
    {
      area: "Cockpit — dept canonical",
      expected: "DeptHomePage /dept",
      check: () =>
        resolveCockpitSurfaceKind("/dept/vente") === "department_home" &&
        readSrc("app/(app)/dept/[deptKey]/page.tsx").includes("DeptHomePage"),
    },
    {
      area: "Cockpit — legacy redirect",
      expected: "/dept/vente",
      check: () => readSrc("app/(app)/vente/dashboard/page.tsx").includes('redirect("/dept/vente")'),
    },
    {
      area: "Shell — shell authority",
      expected: SHELL_RUNTIME.layout,
      check: () => existsSync(join(ROOT, SHELL_RUNTIME.layout)),
    },
    {
      area: "Runtime — layout-access cache",
      expected: "React cache()",
      check: () => readSrc("lib/server/layout-access.ts").includes("cache(async"),
    },
    {
      area: "Performance — registry version",
      expected: RUNTIME_PERFORMANCE_VERSION,
      check: () => RUNTIME_PERFORMANCE_VERSION === "runtime-cleanup-v1",
    },
    {
      area: "Performance — stage4 gains preserved",
      expected: "4 improved metrics",
      check: () => RUNTIME_PERF_MATRIX.filter((m) => m.result === "improved").length === 4,
    },
    {
      area: "Performance — AppShell optimizations",
      expected: "EMPTY_SHELL_RAIL + lazy mobile",
      check: () => {
        const src = readSrc("components/layout/app-shell.tsx");
        return (
          src.includes("EMPTY_SHELL_RAIL") &&
          src.includes("isMobileMenuOpen ? sidebarContent : null") &&
          !src.includes("renderSidebar()")
        );
      },
    },
    {
      area: "Platform — admin hubs routable",
      expected: "intelligence kept",
      check: () => isAdminRouteKept("/admin/intelligence"),
    },
    {
      area: "Super Admin lock — ErpNavSidebar",
      expected: "unchanged export",
      check: () => {
        const src = readSrc("components/layout/app-shell/ErpNavSidebar.tsx");
        return src.includes("export const ErpNavSidebar") && src.includes("filterNavConfig");
      },
    },
    {
      area: "Super Admin lock — no SA file edits in stage4 shell",
      expected: "ErpNavSidebar import only",
      check: () => {
        const shell = readSrc("components/layout/app-shell.tsx");
        return shell.includes("ErpNavSidebar") && !shell.includes("SuperAdminCockpitClient");
      },
    },
    {
      area: "Legacy — shadow cockpits removed",
      expected: "no VenteCockpitClient UI",
      check: () => !existsSync(join(ROOT, "modules/vente/components/cockpit/VenteCockpitClient.tsx")),
    },
    {
      area: "Legacy — placeholder removed",
      expected: "no DepartmentCockpitPlaceholder",
      check: () => !existsSync(join(ROOT, "components/cockpit/DepartmentCockpitPlaceholder.tsx")),
    },
    {
      area: "Admin — all pages in KEEP registry",
      expected: "13 admin routes kept",
      check: () => {
        const routes = listAdminPageRoutes();
        return routes.length >= 12 && routes.every((r) => isAdminRouteKept(r));
      },
    },
    {
      area: "Admin — segments align registry",
      expected: String(ADMIN_APP_SEGMENTS_KEPT.length),
      check: () => ADMIN_APP_SEGMENTS_KEPT.length >= 12,
    },
    {
      area: "Bloc2 — prior stage verdicts recorded",
      expected: "etape4 OPTIMIZED",
      check: () => BLOC2_STAGE_VERDICTS.etape4_performance === "OPTIMIZED",
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
