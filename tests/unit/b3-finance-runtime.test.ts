import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FINANCE_REFERENCE_KPI_SOURCES,
  FINANCE_ERP_STANDARD_SLOTS,
} from "@/lib/erp-core/governance/standard";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("B3 — Finance runtime (B2.4)", () => {
  it("slots runtime Finance présents", () => {
    for (const path of Object.values(FINANCE_ERP_STANDARD_SLOTS)) {
      if (!path.endsWith(".ts")) continue;
      expect(() => readSrc(path)).not.toThrow();
    }
  });

  it("sources KPI versionnées", () => {
    expect(FINANCE_REFERENCE_KPI_SOURCES.treasury).toBe("finance-treasury-runtime-v1");
    expect(FINANCE_REFERENCE_KPI_SOURCES.cockpit).toBe("finance-cockpit-runtime-v1");
  });

  it("trésorerie délègue getFinanceCfoData (pas sales inline)", () => {
    const src = readSrc("lib/finance/runtime/finance-treasury-kpis.ts");
    expect(src).toContain("getFinanceCfoData");
    expect(src).not.toMatch(/from\("sales"\)/);
  });

  it("cockpit /finance/dashboard live", () => {
    const page = readSrc("app/(app)/finance/dashboard/page.tsx");
    expect(page).toContain("getFinanceCockpitPayload");
    expect(page).toContain("FinanceCockpitClient");
    expect(page).not.toContain("DepartmentDashboardPage");
  });

  it("API dept finance délègue buildDeptFinanceKpiPayload", () => {
    const api = readSrc("app/api/dept/[deptKey]/kpis/route.ts");
    expect(api).toContain("buildDeptFinanceKpiPayload");
    const financeCase = api.slice(api.indexOf('case "finance"'));
    expect(financeCase).not.toContain('from("sales")');
  });

  it("registre mutation Finance désactivé (B3 cockpit only)", () => {
    const reg = readSrc("lib/finance/runtime/finance-write-governance.ts");
    expect(reg).toContain("FINANCE_WRITE_ACTION_REGISTRY");
    expect(reg).toMatch(/enabled:\s*false/);
  });

  it("payload cockpit source officielle", () => {
    expect(FINANCE_REFERENCE_KPI_SOURCES.cockpit).toBe("finance-cockpit-runtime-v1");
  });
});
