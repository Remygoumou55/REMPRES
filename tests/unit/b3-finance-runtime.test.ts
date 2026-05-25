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

  it("cockpit /finance/dashboard redirige vers /dept/finance", () => {
    const page = readSrc("app/(app)/finance/dashboard/page.tsx");
    expect(page).toContain('redirect("/dept/finance")');
    const dept = readSrc("app/(app)/dept/[deptKey]/page.tsx");
    expect(dept).toContain("DeptHomePage");
    expect(dept).not.toContain("DepartmentDashboardPage");
  });

  it("API dept finance délègue buildDeptFinanceKpiPayload", () => {
    const api = readSrc("app/api/dept/[deptKey]/kpis/route.ts");
    expect(api).toContain("buildDeptFinanceKpiPayload");
    const financeCase = api.slice(api.indexOf('case "finance"'));
    expect(financeCase).not.toContain('from("sales")');
  });

  it("registre mutation Finance — expense P4.1 activé, reste off", () => {
    const reg = readSrc("lib/finance/runtime/finance-write-governance.ts");
    expect(reg).toContain("FINANCE_WRITE_ACTION_REGISTRY");
    expect(reg).toContain('EXPENSE_CREATE');
    expect(reg).toMatch(/EXPENSE_CREATE[\s\S]*enabled:\s*true/);
    expect(reg).toMatch(/JOURNAL_POST[\s\S]*enabled:\s*true/);
  });

  it("payload cockpit source officielle", () => {
    expect(FINANCE_REFERENCE_KPI_SOURCES.cockpit).toBe("finance-cockpit-runtime-v1");
  });

  it("P6.1 — threshold evaluator branché sur KPI bundle", () => {
    const kpi = readSrc("lib/finance/runtime/finance-kpi-runtime.ts");
    expect(kpi).toContain("finance-threshold-evaluator");
    expect(readSrc("lib/finance/runtime/finance-threshold-rules.ts")).toContain(
      "cfo_negative_profit_month",
    );
  });
});
