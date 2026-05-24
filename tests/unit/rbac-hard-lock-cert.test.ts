/**
 * Matrice certification RBAC — Étapes 2–5 (sans modifier Super Admin).
 */
import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import { canAccessPathForProfile, hasAdminConsoleAccess } from "@/lib/auth/permissions";
import { edgeCanAccessPathForProfile } from "@/lib/middleware/edge-route-guards";
import { resolveSidebarAuthority } from "@/lib/navigation/sidebar-authority";
import { resolvePostLoginRoute } from "@/lib/navigation/home-route";
import { buildProfileAuthoritySlice } from "@/lib/auth/profile-authority";
import { canAccessDeptCockpitPathForProfile } from "@/lib/navigation/route-authority";

type CertExpectation = {
  role: string;
  dept: string | null;
  label: string;
  sidebarMode: "super_admin_erp" | "department_business";
  sidebarDept: string | null;
  routesAllow: string[];
  routesDeny: string[];
  adminConsole: boolean;
  postLoginContains?: string;
};

const CERT_MATRIX: CertExpectation[] = [
  {
    role: "super_admin",
    dept: null,
    label: "SUPER_ADMIN",
    sidebarMode: "super_admin_erp",
    sidebarDept: null,
    routesAllow: ["/dashboard", "/settings/permissions", "/vente/historique"],
    routesDeny: ["/vente/nouvelle-vente", "/finance"],
    adminConsole: true,
    postLoginContains: "/dashboard",
  },
  {
    role: "manager",
    dept: DEPARTMENT_KEYS.VENTE,
    label: "VENTE",
    sidebarMode: "department_business",
    sidebarDept: DEPARTMENT_KEYS.VENTE,
    routesAllow: ["/vente/clients", "/dept/vente"],
    routesDeny: ["/finance", "/rh", "/dept/finance", "/admin/platform-dashboard"],
    adminConsole: false,
    postLoginContains: "/dept/vente",
  },
  {
    role: "manager",
    dept: DEPARTMENT_KEYS.FINANCE,
    label: "FINANCE",
    sidebarMode: "department_business",
    sidebarDept: DEPARTMENT_KEYS.FINANCE,
    routesAllow: ["/finance/depenses", "/dept/finance"],
    routesDeny: ["/vente/historique", "/dept/vente"],
    adminConsole: false,
  },
  {
    role: "manager",
    dept: DEPARTMENT_KEYS.RH,
    label: "RH",
    sidebarMode: "department_business",
    sidebarDept: DEPARTMENT_KEYS.RH,
    routesAllow: ["/rh/conges", "/dept/rh"],
    routesDeny: ["/vente/crm", "/finance"],
    adminConsole: false,
  },
  {
    role: "responsable_vente",
    dept: null,
    label: "LEGACY_VENTE",
    sidebarMode: "department_business",
    sidebarDept: DEPARTMENT_KEYS.VENTE,
    routesAllow: ["/dept/vente", "/vente/produits"],
    routesDeny: ["/dept/rh", "/dept/finance"],
    adminConsole: false,
  },
  {
    role: "directeur_general",
    dept: DEPARTMENT_KEYS.ADMINISTRATION,
    label: "DG",
    sidebarMode: "department_business",
    sidebarDept: DEPARTMENT_KEYS.ADMINISTRATION,
    routesAllow: ["/actions", "/admin/platform-dashboard"],
    routesDeny: ["/vente/clients", "/finance"],
    adminConsole: true,
  },
  {
    role: "accountant",
    dept: DEPARTMENT_KEYS.FINANCE,
    label: "COMPTABLE",
    sidebarMode: "department_business",
    sidebarDept: DEPARTMENT_KEYS.FINANCE,
    routesAllow: ["/finance"],
    routesDeny: ["/vente/historique"],
    adminConsole: false,
  },
];

function assertRoutes(role: string, dept: string | null, allow: string[], deny: string[]) {
  for (const path of allow) {
    expect(canAccessPathForProfile(path, role, dept), `app allow ${path}`).toBe(true);
    expect(edgeCanAccessPathForProfile(path, role, dept), `edge allow ${path}`).toBe(true);
  }
  for (const path of deny) {
    expect(canAccessPathForProfile(path, role, dept), `app deny ${path}`).toBe(false);
    expect(edgeCanAccessPathForProfile(path, role, dept), `edge deny ${path}`).toBe(false);
  }
}

describe("RBAC hard lock certification matrix", () => {
  for (const row of CERT_MATRIX) {
    it(`${row.label} — sidebar isolée`, () => {
      const sidebar = resolveSidebarAuthority({
        isSuperAdmin: row.role === "super_admin",
        roleKey: row.role,
        departmentKey: row.dept,
      });
      expect(sidebar.mode).toBe(row.sidebarMode);
      expect(sidebar.authorityDepartmentKey).toBe(row.sidebarDept);
      if (row.role !== "super_admin") {
        expect(sidebar.usesErpGlobalSidebar).toBe(false);
      }
    });

    it(`${row.label} — routes certifiées`, () => {
      assertRoutes(row.role, row.dept, row.routesAllow, row.routesDeny);
    });

    it(`${row.label} — console admin`, () => {
      expect(hasAdminConsoleAccess(row.role, row.dept)).toBe(row.adminConsole);
    });

    if (row.postLoginContains) {
      it(`${row.label} — post-login`, () => {
        const route = resolvePostLoginRoute(row.role, row.dept);
        expect(route).toContain(row.postLoginContains);
      });
    }
  }

  it("authority unique — pas de drift flags sur profils canoniques", () => {
    const slice = buildProfileAuthoritySlice("manager", DEPARTMENT_KEYS.VENTE);
    expect(slice.authorityDepartmentKey).toBe(DEPARTMENT_KEYS.VENTE);
    expect(slice.driftFlags).not.toContain("department_from_legacy_role_only");
  });

  it("cookie rempres_role non utilisé dans route authority", () => {
    const withoutCookie = canAccessPathForProfile("/finance", "manager", DEPARTMENT_KEYS.VENTE);
    expect(withoutCookie).toBe(false);
  });

  it("dept API path lock — responsable_vente ne lit pas rh cockpit", () => {
    expect(
      canAccessDeptCockpitPathForProfile("/dept/rh", "responsable_vente", null),
    ).toBe(false);
  });
});
