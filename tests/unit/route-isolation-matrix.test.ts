import { describe, expect, it } from "vitest";
import { canAccessPathForProfile, hasAdminConsoleAccess } from "@/lib/auth/permissions";
import { edgeCanAccessPathForProfile } from "@/lib/middleware/edge-route-guards";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import {
  canAccessDeptCockpitPathForProfile,
  resolveAuthorityRoutePrefixes,
} from "@/lib/navigation/route-authority";

type MatrixRow = {
  role: string;
  dept: string | null;
  path: string;
  expected: boolean;
  label: string;
};

const MATRIX: MatrixRow[] = [
  { role: "manager", dept: DEPARTMENT_KEYS.VENTE, path: "/vente/clients", expected: true, label: "VENTE vente" },
  { role: "manager", dept: DEPARTMENT_KEYS.VENTE, path: "/finance", expected: false, label: "VENTE deny finance" },
  { role: "manager", dept: DEPARTMENT_KEYS.VENTE, path: "/rh", expected: false, label: "VENTE deny rh" },
  { role: "manager", dept: DEPARTMENT_KEYS.VENTE, path: "/dept/vente", expected: true, label: "VENTE dept cockpit" },
  { role: "manager", dept: DEPARTMENT_KEYS.VENTE, path: "/dept/finance", expected: false, label: "VENTE deny dept finance" },
  { role: "manager", dept: DEPARTMENT_KEYS.FINANCE, path: "/finance/depenses", expected: true, label: "FINANCE" },
  { role: "manager", dept: DEPARTMENT_KEYS.FINANCE, path: "/vente/historique", expected: false, label: "FINANCE deny vente" },
  { role: "manager", dept: DEPARTMENT_KEYS.RH, path: "/rh/conges", expected: true, label: "RH" },
  { role: "manager", dept: DEPARTMENT_KEYS.RH, path: "/vente/crm", expected: false, label: "RH deny vente" },
  { role: "responsable_vente", dept: null, path: "/dept/vente", expected: true, label: "legacy vente dept" },
  { role: "responsable_vente", dept: null, path: "/dept/finance", expected: false, label: "legacy vente deny dept finance" },
  { role: "responsable_vente", dept: null, path: "/dept/rh", expected: false, label: "legacy vente deny dept rh" },
  { role: "directeur_general", dept: DEPARTMENT_KEYS.ADMINISTRATION, path: "/actions", expected: true, label: "DG actions" },
  { role: "directeur_general", dept: DEPARTMENT_KEYS.ADMINISTRATION, path: "/vente/clients", expected: false, label: "DG deny vente" },
  { role: "directeur_general", dept: null, path: "/admin/platform-dashboard", expected: true, label: "DG legacy null dept admin" },
  { role: "super_admin", dept: null, path: "/dashboard", expected: true, label: "SA dashboard" },
  { role: "super_admin", dept: null, path: "/vente/nouvelle-vente", expected: false, label: "SA deny operational vente" },
];

describe("route isolation matrix (Étape 4)", () => {
  for (const row of MATRIX) {
    it(`${row.label}: ${row.role} ${row.path}`, () => {
      expect(canAccessPathForProfile(row.path, row.role, row.dept)).toBe(row.expected);
      expect(edgeCanAccessPathForProfile(row.path, row.role, row.dept)).toBe(row.expected);
    });
  }

  it("edge et app partagent la même décision dept cockpit", () => {
    const path = "/dept/finance";
    const app = canAccessDeptCockpitPathForProfile(path, "manager", DEPARTMENT_KEYS.VENTE);
    const edge = edgeCanAccessPathForProfile(path, "manager", DEPARTMENT_KEYS.VENTE);
    expect(app).toBe(false);
    expect(edge).toBe(false);
  });

  it("resolveAuthorityRoutePrefixes utilise le département effectif", () => {
    expect(resolveAuthorityRoutePrefixes("responsable_vente", null)).toContain("/vente");
    expect(resolveAuthorityRoutePrefixes("manager", DEPARTMENT_KEYS.FINANCE)).toContain("/finance");
  });

  it("hasAdminConsoleAccess résout DG sans department_key DB", () => {
    expect(hasAdminConsoleAccess("directeur_general", null)).toBe(true);
  });
});
