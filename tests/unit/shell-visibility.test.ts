import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import {
  isFormationDepartmentKey,
  isVenteDepartmentKey,
  resolveShellRailVisibility,
  shouldShowDashboardModuleShortcut,
} from "@/lib/navigation/shell-visibility";

const denyAll = {
  canReadClients: false,
  canReadProducts: false,
  canReadFinance: false,
  canReadRh: false,
  canReadLogistics: false,
  canReadFormation: false,
  canReadMarketing: false,
  canReadCrm: false,
};

const venteRead = {
  ...denyAll,
  canReadClients: true,
  canReadProducts: true,
  canReadCrm: true,
};

describe("shell visibility M2 alignment", () => {
  it("masque tout le rail métier pour super_admin", () => {
    const rail = resolveShellRailVisibility({
      roleKey: "super_admin",
      departmentKey: null,
      ...venteRead,
    });
    expect(rail.commerce).toBe(false);
    expect(rail.crm).toBe(false);
    expect(rail.finance).toBe(false);
    expect(rail.settings).toBe(false);
  });

  it("MANAGER_VENTE voit Vente+CRM mais pas Finance/RH/Logistique", () => {
    const rail = resolveShellRailVisibility({
      roleKey: "manager",
      departmentKey: DEPARTMENT_KEYS.VENTE,
      ...venteRead,
    });
    expect(rail.commerce).toBe(true);
    expect(rail.crm).toBe(true);
    expect(rail.finance).toBe(false);
    expect(rail.rh).toBe(false);
    expect(rail.logistics).toBe(false);
    expect(rail.formation).toBe(false);
    expect(rail.settings).toBe(false);
  });

  it("MANAGER_FINANCE voit Finance uniquement", () => {
    const rail = resolveShellRailVisibility({
      roleKey: "manager",
      departmentKey: DEPARTMENT_KEYS.FINANCE,
      ...denyAll,
      canReadFinance: true,
    });
    expect(rail.finance).toBe(true);
    expect(rail.commerce).toBe(false);
    expect(rail.crm).toBe(false);
  });

  it("RH visible uniquement pour département RH avec lecture module", () => {
    expect(
      resolveShellRailVisibility({
        roleKey: "manager",
        departmentKey: DEPARTMENT_KEYS.VENTE,
        ...denyAll,
        canReadRh: true,
      }).rh,
    ).toBe(false);
    expect(
      resolveShellRailVisibility({
        roleKey: "manager",
        departmentKey: DEPARTMENT_KEYS.RH,
        ...denyAll,
        canReadRh: true,
      }).rh,
    ).toBe(true);
  });

  it("Logistique non universelle — requiert dept LOGISTIQUE", () => {
    const rail = resolveShellRailVisibility({
      roleKey: "agent",
      departmentKey: DEPARTMENT_KEYS.LOGISTIQUE,
      ...denyAll,
      canReadLogistics: true,
    });
    expect(rail.logistics).toBe(true);
    expect(
      resolveShellRailVisibility({
        roleKey: "agent",
        departmentKey: DEPARTMENT_KEYS.VENTE,
        ...denyAll,
        canReadLogistics: true,
      }).logistics,
    ).toBe(false);
  });

  it("responsable_vente legacy + department_key null aligne rail sur sidebar", () => {
    const rail = resolveShellRailVisibility({
      roleKey: "responsable_vente",
      departmentKey: null,
      ...venteRead,
    });
    expect(rail.commerce).toBe(true);
    expect(rail.crm).toBe(true);
    expect(rail.finance).toBe(false);
  });

  it("expose Formation pour FORMATION et legacy CONSULTATION", () => {
    expect(isFormationDepartmentKey("manager", DEPARTMENT_KEYS.FORMATION)).toBe(true);
    expect(isFormationDepartmentKey("manager", DEPARTMENT_KEYS.CONSULTATION)).toBe(true);
    const rail = resolveShellRailVisibility({
      roleKey: "manager",
      departmentKey: DEPARTMENT_KEYS.CONSULTATION,
      ...denyAll,
      canReadFormation: true,
    });
    expect(rail.formation).toBe(true);
    expect(rail.marketing).toBe(false);
  });

  it("Paramètres rail réservés super_admin — pas manager vente", () => {
    expect(
      resolveShellRailVisibility({
        roleKey: "manager",
        departmentKey: DEPARTMENT_KEYS.VENTE,
        ...venteRead,
      }).settings,
    ).toBe(false);
  });

  it("Actions visibles pour manager ADMINISTRATION (ex-DG)", () => {
    expect(
      resolveShellRailVisibility({
        roleKey: "manager",
        departmentKey: DEPARTMENT_KEYS.ADMINISTRATION,
        ...denyAll,
      }).actions,
    ).toBe(true);
    expect(
      resolveShellRailVisibility({
        roleKey: "manager",
        departmentKey: DEPARTMENT_KEYS.VENTE,
        ...venteRead,
      }).actions,
    ).toBe(false);
  });

  it("CRM requiert département Vente", () => {
    expect(isVenteDepartmentKey("manager", DEPARTMENT_KEYS.VENTE)).toBe(true);
    expect(
      resolveShellRailVisibility({
        roleKey: "manager",
        departmentKey: DEPARTMENT_KEYS.MARKETING,
        ...denyAll,
        canReadCrm: true,
        canReadClients: true,
      }).crm,
    ).toBe(false);
  });

  it("raccourcis homepage suivent le rail", () => {
    const rail = resolveShellRailVisibility({
      roleKey: "manager",
      departmentKey: DEPARTMENT_KEYS.VENTE,
      ...venteRead,
    });
    expect(shouldShowDashboardModuleShortcut("vente", rail)).toBe(true);
    expect(shouldShowDashboardModuleShortcut("finance", rail)).toBe(false);
  });
});
