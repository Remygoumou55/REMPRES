import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ERP_GOVERNANCE_STANDARD_VERSION,
  ERP_REFERENCE_DEPARTMENT_KEY,
  VENTE_REFERENCE_KPI_SOURCES,
  VENTE_ERP_STANDARD_SLOTS,
} from "@/lib/erp-core/governance/standard";
import { COCKPIT_ZONE_ORDER } from "@/lib/navigation/erp-ux-architecture";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("B2.4 — ERP Governance Standard", () => {
  it("version et département référence officiels", () => {
    expect(ERP_GOVERNANCE_STANDARD_VERSION).toBe("erp-governance-standard-b2.4-v1");
    expect(ERP_REFERENCE_DEPARTMENT_KEY).toBe("VENTE");
  });

  it("modules standard runtime/kpi/security/mutation/orchestration/cockpit présents", () => {
    for (const f of [
      "runtime-standard.ts",
      "kpi-standard.ts",
      "security-standard.ts",
      "mutation-standard.ts",
      "orchestration-standard.ts",
      "cockpit-standard.ts",
    ]) {
      expect(readSrc(`lib/erp-core/governance/standard/${f}`).length).toBeGreaterThan(100);
    }
  });

  it("cockpit standard réutilise COCKPIT_ZONE_ORDER M3", () => {
    const src = readSrc("lib/erp-core/governance/standard/cockpit-standard.ts");
    expect(src).toContain("COCKPIT_ZONE_ORDER");
    expect(COCKPIT_ZONE_ORDER.length).toBe(6);
  });

  it("Vente référence implémente tous les slots runtime (fichiers)", () => {
    for (const path of Object.values(VENTE_ERP_STANDARD_SLOTS)) {
      if (!path.endsWith(".ts")) continue;
      expect(() => readSrc(path)).not.toThrow();
    }
  });

  it("Vente cockpit factorisé sur /dept/vente (DeptHomePage)", () => {
    const legacy = readSrc("app/(app)/vente/dashboard/page.tsx");
    expect(legacy).toContain('redirect("/dept/vente")');
    const dept = readSrc("app/(app)/dept/[deptKey]/page.tsx");
    expect(dept).toContain("DeptHomePage");
    expect(dept).not.toContain("DepartmentDashboardPage");
  });

  it("RH et Finance legacy redirigent vers /dept/*", () => {
    const rh = readSrc("app/(app)/rh/dashboard/page.tsx");
    expect(rh).toContain('redirect("/dept/rh")');
    const finance = readSrc("app/(app)/finance/dashboard/page.tsx");
    expect(finance).toContain('redirect("/dept/finance")');
  });

  it("API dept finance délègue runtime B3 (plus inline sales)", () => {
    const api = readSrc("app/api/dept/[deptKey]/kpis/route.ts");
    expect(api).toContain("buildDeptFinanceKpiPayload");
    const financeBlock = api.slice(api.indexOf('case "finance"'));
    expect(financeBlock).not.toContain('from("sales")');
  });
});
