import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";

vi.mock("@/lib/server/auth-session", () => ({
  getServerSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/permissions", () => ({
  getProfileAuthBrief: vi.fn(),
  getModulePermissions: vi.fn(),
  isSuperAdmin: vi.fn(),
}));

import { getProfileAuthBrief, getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";
import {
  assertApiDeptKpiAccess,
  assertApiFinanceModuleAccess,
  assertApiRhModuleAccess,
} from "@/lib/server/api-route-guard";

const brief = (roleKey: string, departmentKey: string | null, authorityDepartmentKey: string | null = null) => ({
  roleKey,
  departmentKey,
  departmentId: null,
  authorityDepartmentKey: authorityDepartmentKey ?? departmentKey,
  authorityDriftFlags: [] as const,
  ok: true,
  supervisionScope: "departmental" as const,
});

beforeEach(() => {
  vi.mocked(isSuperAdmin).mockResolvedValue(false);
  vi.mocked(getModulePermissions).mockResolvedValue({
    canRead: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  });
});

describe("api-route-guard (Étape 5)", () => {
  it("refuse VENTE sur KPI finance", async () => {
    vi.mocked(getProfileAuthBrief).mockResolvedValue(
      brief("manager", DEPARTMENT_KEYS.VENTE, DEPARTMENT_KEYS.VENTE),
    );
    const result = await assertApiDeptKpiAccess("user-1", "finance");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("autorise VENTE sur KPI vente", async () => {
    vi.mocked(getProfileAuthBrief).mockResolvedValue(
      brief("manager", DEPARTMENT_KEYS.VENTE, DEPARTMENT_KEYS.VENTE),
    );
    const result = await assertApiDeptKpiAccess("user-1", "vente");
    expect(result.ok).toBe(true);
  });

  it("refuse DG sur KPI vente (plus de bypass legacyDG)", async () => {
    vi.mocked(getProfileAuthBrief).mockResolvedValue(
      brief("directeur_general", DEPARTMENT_KEYS.ADMINISTRATION, DEPARTMENT_KEYS.ADMINISTRATION),
    );
    const result = await assertApiDeptKpiAccess("user-1", "vente");
    expect(result.ok).toBe(false);
  });

  it("super_admin passe dept KPI (gouvernance inchangée)", async () => {
    vi.mocked(isSuperAdmin).mockResolvedValue(true);
    vi.mocked(getProfileAuthBrief).mockResolvedValue(brief("super_admin", null, null));
    const result = await assertApiDeptKpiAccess("user-1", "vente");
    expect(result.ok).toBe(true);
  });

  it("assertApiFinanceModuleAccess refuse manager VENTE", async () => {
    vi.mocked(getProfileAuthBrief).mockResolvedValue(
      brief("manager", DEPARTMENT_KEYS.VENTE, DEPARTMENT_KEYS.VENTE),
    );
    const result = await assertApiFinanceModuleAccess("user-1");
    expect(result.ok).toBe(false);
  });

  it("assertApiRhModuleAccess refuse manager VENTE", async () => {
    vi.mocked(getProfileAuthBrief).mockResolvedValue(
      brief("manager", DEPARTMENT_KEYS.VENTE, DEPARTMENT_KEYS.VENTE),
    );
    const result = await assertApiRhModuleAccess("user-1");
    expect(result.ok).toBe(false);
  });

  it("assertApiRhModuleAccess autorise manager RH", async () => {
    vi.mocked(getProfileAuthBrief).mockResolvedValue(
      brief("manager", DEPARTMENT_KEYS.RH, DEPARTMENT_KEYS.RH),
    );
    const result = await assertApiRhModuleAccess("user-1");
    expect(result.ok).toBe(true);
  });
});
