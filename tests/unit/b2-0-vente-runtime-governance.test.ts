import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  OFFICIAL_QUOTE_SALE_ORCHESTRATION_PLAN,
  validateQuoteSaleLinkConsistency,
} from "@/lib/vente/runtime/quote-sale-orchestration";
import {
  SALES_OPERATIONAL_LIFECYCLE,
  SALES_LIFECYCLE_STATUS,
} from "@/lib/vente/runtime/sales-lifecycle";
import { summarizeSaleAmounts } from "@/lib/vente/runtime/sale-kpi-aggregates";
import { VENTE_COMMERCE_KPI_SOURCE } from "@/lib/vente/runtime/vente-commerce-kpis";

const root = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("B2.0 — Vente runtime governance", () => {
  it("lifecycle officiel = validated pour KPI opérationnels", () => {
    expect(SALES_OPERATIONAL_LIFECYCLE).toBe(SALES_LIFECYCLE_STATUS.VALIDATED);
  });

  it("agrégat CA net soustrait les ventes payment_status cancelled", () => {
    const summary = summarizeSaleAmounts([
      { total_amount_gnf: 100, payment_status: "paid", created_at: "2026-01-01" },
      { total_amount_gnf: 50, payment_status: "cancelled", created_at: "2026-01-01" },
    ]);
    expect(summary.grossSaleAmount).toBe(150);
    expect(summary.netSaleAmount).toBe(100);
  });

  it("orchestration devis→vente exige cohérence FK", () => {
    const bad = validateQuoteSaleLinkConsistency({
      quoteId: "q1",
      quoteStatus: "converted",
      quoteSaleId: "s1",
      saleId: "s2",
      saleCrmQuoteId: "q1",
      saleLifecycleStatus: "validated",
    });
    expect(bad.ok).toBe(false);

    const good = validateQuoteSaleLinkConsistency({
      quoteId: "q1",
      quoteStatus: "converted",
      quoteSaleId: "s1",
      saleId: "s1",
      saleCrmQuoteId: "q1",
      saleLifecycleStatus: "validated",
    });
    expect(good.ok).toBe(true);
  });

  it("plan orchestration officiel versionné", () => {
    expect(OFFICIAL_QUOTE_SALE_ORCHESTRATION_PLAN.rollbackOnFailure).toBe(true);
    expect(OFFICIAL_QUOTE_SALE_ORCHESTRATION_PLAN.steps.length).toBe(5);
  });

  it("CRM convert_sale activé (B2.2)", () => {
    const src = readSrc("lib/vente/runtime/crm-write-governance.ts");
    expect(src).toContain("QUOTE_CONVERT_SALE");
    expect(src).toMatch(/QUOTE_CONVERT_SALE[\s\S]*enabled:\s*true/);
  });

  it("getDashboardKpis délègue à getVenteCommerceKpis", () => {
    const src = readSrc("lib/server/dashboard-kpis.ts");
    expect(src).toContain("getVenteCommerceKpis");
    expect(src).not.toMatch(/from\("sales"\)[\s\S]*deleted_at/);
  });

  it("API dept vente délègue à buildDeptVenteKpiPayload", () => {
    const src = readSrc("app/api/dept/[deptKey]/kpis/route.ts");
    expect(src).toContain("buildDeptVenteKpiPayload");
  });

  it("source KPI commerce unique documentée", () => {
    expect(VENTE_COMMERCE_KPI_SOURCE).toBe("vente-commerce-runtime-v1");
  });

  it("crm-overview expose source runtime et guarded access", () => {
    const src = readSrc("modules/crm/server/services/crm-overview.ts");
    expect(src).toContain("CRM_OPERATIONAL_KPI_SOURCE");
    expect(src).toContain("getCrmOperationalOverviewGuarded");
    expect(src).toContain("is_terminal_win");
  });
});
