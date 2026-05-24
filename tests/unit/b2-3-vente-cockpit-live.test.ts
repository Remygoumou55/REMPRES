import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("B2.3 — Cockpit Vente live", () => {
  it("payload source versionné", () => {
    const src = readSrc("lib/vente/runtime/vente-cockpit-payload.ts");
    expect(src).toContain('VENTE_COCKPIT_PAYLOAD_SOURCE = "vente-cockpit-runtime-v1"');
  });

  it("getVenteCockpitPayload compose bundle B2.0", () => {
    const src = readSrc("lib/vente/runtime/vente-cockpit-payload.ts");
    expect(src).toContain("getVenteRuntimeKpiBundle");
    expect(src).not.toMatch(/getDashboardKpis\s*\(/);
    expect(src).toContain("VENTE_COMMERCE_KPI_SOURCE");
    expect(src).toContain("CRM_OPERATIONAL_KPI_SOURCE");
  });

  it("/vente/dashboard redirige vers /dept/vente (DeptHomePage)", () => {
    const page = readSrc("app/(app)/vente/dashboard/page.tsx");
    expect(page).toContain('redirect("/dept/vente")');
    const dept = readSrc("app/(app)/dept/[deptKey]/page.tsx");
    expect(dept).toContain("DeptHomePage");
    expect(dept).toContain("getDeptDashboardData");
  });

  it("cockpit client expose zones M3 + KPI cards", () => {
    const ui = readSrc("modules/vente/components/cockpit/VenteCockpitClient.tsx");
    expect(ui).toContain("CockpitMetricCard");
    expect(ui).toContain("COCKPIT_ZONE_ORDER");
    expect(ui).toContain("SalesChart");
    expect(ui).toContain("CA net du jour");
  });

  it("quick actions officielles (max 6, libellés)", () => {
    const src = readSrc("lib/vente/runtime/vente-cockpit-payload.ts");
    expect(src).toContain("OFFICIAL_VENTE_COCKPIT_QUICK_ACTIONS");
    expect(src).toContain('id: "new_sale"');
    expect(src).toContain('href: "/vente/nouvelle-vente"');
    const actionBlocks = src.match(/id: "[^"]+"/g) ?? [];
    expect(actionBlocks.length).toBeGreaterThanOrEqual(6);
  });
});
