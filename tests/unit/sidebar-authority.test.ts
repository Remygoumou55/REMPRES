import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import {
  ERP_GLOBAL_SIDEBAR_ROLES,
  resolveSidebarAuthority,
} from "@/lib/navigation/sidebar-authority";

describe("sidebar-authority", () => {
  it("ERP global réservé à super_admin uniquement", () => {
    expect(ERP_GLOBAL_SIDEBAR_ROLES).toEqual(["super_admin"]);
  });

  it("super_admin → ErpNavSidebar (gelé)", () => {
    const r = resolveSidebarAuthority({
      isSuperAdmin: true,
      roleKey: "super_admin",
      departmentKey: null,
    });
    expect(r.mode).toBe("super_admin_erp");
    expect(r.usesErpGlobalSidebar).toBe(true);
    expect(r.visibilityLock).toBe("locked");
  });

  it("directeur_general → department_business ADMINISTRATION (pas ERP global)", () => {
    const r = resolveSidebarAuthority({
      isSuperAdmin: false,
      roleKey: "directeur_general",
      departmentKey: null,
    });
    expect(r.mode).toBe("department_business");
    expect(r.usesErpGlobalSidebar).toBe(false);
    expect(r.authorityDepartmentKey).toBe(DEPARTMENT_KEYS.ADMINISTRATION);
  });

  it("manager VENTE → department_business isolé", () => {
    const r = resolveSidebarAuthority({
      isSuperAdmin: false,
      roleKey: "manager",
      departmentKey: DEPARTMENT_KEYS.VENTE,
    });
    expect(r.mode).toBe("department_business");
    expect(r.authorityDepartmentKey).toBe(DEPARTMENT_KEYS.VENTE);
    expect(r.usesErpGlobalSidebar).toBe(false);
  });
});
