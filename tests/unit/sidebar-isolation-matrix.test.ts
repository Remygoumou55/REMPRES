import { describe, expect, it } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import {
  buildDepartmentSidebarGroups,
  lockDepartmentSidebarGroups,
} from "@/lib/navigation/department-sidebar-nav";
import { OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE } from "@/lib/navigation/erp-ux-architecture";
import { resolveShellRailVisibility } from "@/lib/navigation/shell-visibility";
import { resolveSidebarAuthority } from "@/lib/navigation/sidebar-authority";

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

type MatrixRow = {
  role: string;
  departmentKey: string | null;
  perms?: Partial<typeof denyAll>;
  expectMode: "super_admin_erp" | "department_business";
  expectDept: string | null;
  allowedGroupIds: string[];
  forbiddenGroupIds: string[];
};

const MATRIX: MatrixRow[] = [
  {
    role: "super_admin",
    departmentKey: null,
    expectMode: "super_admin_erp",
    expectDept: null,
    allowedGroupIds: [],
    forbiddenGroupIds: ["commerce", "finance", "rh"],
  },
  {
    role: "manager",
    departmentKey: DEPARTMENT_KEYS.VENTE,
    perms: { canReadClients: true, canReadProducts: true, canReadCrm: true },
    expectMode: "department_business",
    expectDept: DEPARTMENT_KEYS.VENTE,
    allowedGroupIds: ["commerce", "crm"],
    forbiddenGroupIds: ["finance", "rh", "logistique", "marketing", "formation"],
  },
  {
    role: "manager",
    departmentKey: DEPARTMENT_KEYS.FINANCE,
    perms: { canReadFinance: true },
    expectMode: "department_business",
    expectDept: DEPARTMENT_KEYS.FINANCE,
    allowedGroupIds: ["finance"],
    forbiddenGroupIds: ["commerce", "crm", "rh"],
  },
  {
    role: "manager",
    departmentKey: DEPARTMENT_KEYS.RH,
    perms: { canReadRh: true },
    expectMode: "department_business",
    expectDept: DEPARTMENT_KEYS.RH,
    allowedGroupIds: ["rh"],
    forbiddenGroupIds: ["commerce", "finance"],
  },
  {
    role: "responsable_vente",
    departmentKey: null,
    perms: { canReadClients: true, canReadProducts: true, canReadCrm: true },
    expectMode: "department_business",
    expectDept: DEPARTMENT_KEYS.VENTE,
    allowedGroupIds: ["commerce", "crm"],
    forbiddenGroupIds: ["finance", "rh"],
  },
  {
    role: "directeur_general",
    departmentKey: DEPARTMENT_KEYS.ADMINISTRATION,
    expectMode: "department_business",
    expectDept: DEPARTMENT_KEYS.ADMINISTRATION,
    allowedGroupIds: ["actions"],
    forbiddenGroupIds: ["commerce", "finance", "crm", "rh", "settings"],
  },
  {
    role: "manager",
    departmentKey: DEPARTMENT_KEYS.LOGISTIQUE,
    perms: { canReadLogistics: true },
    expectMode: "department_business",
    expectDept: DEPARTMENT_KEYS.LOGISTIQUE,
    allowedGroupIds: ["logistique"],
    forbiddenGroupIds: ["commerce", "finance"],
  },
];

describe("sidebar isolation matrix (Étape 3)", () => {
  for (const row of MATRIX) {
    it(`${row.role} / ${row.departmentKey ?? "null"} → mode ${row.expectMode}`, () => {
      const authority = resolveSidebarAuthority({
        isSuperAdmin: row.role === "super_admin",
        roleKey: row.role,
        departmentKey: row.departmentKey,
      });

      expect(authority.mode).toBe(row.expectMode);
      expect(authority.authorityDepartmentKey).toBe(row.expectDept);

      if (row.expectMode === "super_admin_erp") return;

      const shellRail = resolveShellRailVisibility({
        roleKey: row.role,
        departmentKey: row.departmentKey,
        ...denyAll,
        ...row.perms,
      });

      const groups = lockDepartmentSidebarGroups(
        buildDepartmentSidebarGroups(row.expectDept, {
          includeActions: shellRail.actions,
          includeSettings: shellRail.settings,
        }),
        shellRail,
        row.perms?.canReadClients ?? false,
        row.perms?.canReadProducts ?? false,
      );

      const ids = groups.map((g) => g.id);
      for (const id of row.allowedGroupIds) {
        expect(ids, `missing ${id}`).toContain(id);
      }
      for (const id of row.forbiddenGroupIds) {
        expect(ids, `unexpected ${id}`).not.toContain(id);
      }
    });
  }

  it("chaque département métier a une architecture sidebar officielle", () => {
    const keys = [
      DEPARTMENT_KEYS.VENTE,
      DEPARTMENT_KEYS.FINANCE,
      DEPARTMENT_KEYS.RH,
      DEPARTMENT_KEYS.FORMATION,
      DEPARTMENT_KEYS.MARKETING,
      DEPARTMENT_KEYS.LOGISTIQUE,
      DEPARTMENT_KEYS.ADMINISTRATION,
    ] as const;
    for (const k of keys) {
      expect(OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE[k]).toBeDefined();
    }
  });
});
