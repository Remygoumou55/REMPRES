import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import {
  getSidebarForRole,
  resolveSidebarDepartmentKey,
  resolveSidebarRenderMode,
  usesErpGlobalSidebar,
} from "@/lib/navigation/sidebar-for-role";

describe("sidebar-for-role", () => {
  it("super_admin → erp global (inchangé)", () => {
    const mode = resolveSidebarRenderMode({
      isSuperAdmin: true,
      roleKey: "super_admin",
      departmentKey: null,
    });
    expect(mode).toBe("super_admin_erp");
    expect(usesErpGlobalSidebar(mode)).toBe(true);
  });

  it("directeur_general → department_business ADMINISTRATION (isolé, pas ErpNavSidebar)", () => {
    const result = getSidebarForRole({
      isSuperAdmin: false,
      roleKey: "directeur_general",
      departmentKey: null,
    });
    expect(result.mode).toBe("department_business");
    expect(result.departmentKey).toBe(DEPARTMENT_KEYS.ADMINISTRATION);
    expect(usesErpGlobalSidebar(result.mode)).toBe(false);
  });

  it("manager + VENTE → department_business (pas ErpNavSidebar)", () => {
    const result = getSidebarForRole({
      isSuperAdmin: false,
      roleKey: "manager",
      departmentKey: DEPARTMENT_KEYS.VENTE,
    });
    expect(result.mode).toBe("department_business");
    expect(result.departmentKey).toBe(DEPARTMENT_KEYS.VENTE);
    expect(usesErpGlobalSidebar(result.mode)).toBe(false);
  });

  it("responsable_vente legacy → department_business via alias département", () => {
    const dept = resolveSidebarDepartmentKey("responsable_vente", null);
    expect(dept).toBe(DEPARTMENT_KEYS.VENTE);
    const result = getSidebarForRole({
      isSuperAdmin: false,
      roleKey: "responsable_vente",
      departmentKey: null,
    });
    expect(result.mode).toBe("department_business");
    expect(result.departmentKey).toBe(DEPARTMENT_KEYS.VENTE);
  });

  it("comptable → FINANCE", () => {
    const result = getSidebarForRole({
      isSuperAdmin: false,
      roleKey: "comptable",
      departmentKey: null,
    });
    expect(result.departmentKey).toBe(DEPARTMENT_KEYS.FINANCE);
    expect(result.mode).toBe("department_business");
  });

  it("manager sans département ne retombe pas sur erp global", () => {
    const mode = resolveSidebarRenderMode({
      isSuperAdmin: false,
      roleKey: "manager",
      departmentKey: null,
    });
    expect(mode).toBe("department_business");
    expect(usesErpGlobalSidebar(mode)).toBe(false);
  });
});
