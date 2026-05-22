import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertQuoteSaleOrchestrationReady,
  validateQuoteSaleLinkConsistency,
} from "@/lib/vente/runtime/quote-sale-orchestration";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("B2.2 — Quote → sale conversion", () => {
  it("RPC SQL convert_crm_quote_to_sale présent", () => {
    const sql = readSrc("supabase/sql/051_crm_quote_convert_sale_orchestration.sql");
    expect(sql).toContain("convert_crm_quote_to_sale");
    expect(sql).toContain("create_sale_transaction");
    expect(sql).toContain("crm_quote_id");
    expect(sql).toContain("status = 'converted'");
  });

  it("service TS appelle RPC + gouvernance", () => {
    const svc = readSrc("modules/crm/server/services/quote-sale-conversion.ts");
    expect(svc).toContain("convert_crm_quote_to_sale");
    expect(svc).toContain("QUOTE_CONVERT_SALE");
    expect(svc).toContain("assertQuoteSaleOrchestrationReady");
  });

  it("action + UI conversion devis accepté", () => {
    const act = readSrc("modules/crm/server/actions/crm-actions.ts");
    const ui = readSrc("modules/crm/components/workflows/CrmQuoteConvertButton.tsx");
    expect(act).toContain("convertCrmQuoteToSaleAction");
    expect(ui).toContain("convertCrmQuoteToSaleAction");
  });

  it("orchestration post-conversion cohérente", () => {
    expect(() =>
      assertQuoteSaleOrchestrationReady({
        quoteId: "q-1",
        quoteStatus: "converted",
        quoteSaleId: "s-1",
        saleId: "s-1",
        saleCrmQuoteId: "q-1",
        saleLifecycleStatus: "validated",
      }),
    ).not.toThrow();

    const bad = validateQuoteSaleLinkConsistency({
      quoteId: "q-1",
      quoteStatus: "converted",
      quoteSaleId: "s-1",
      saleId: "s-2",
      saleCrmQuoteId: "q-1",
      saleLifecycleStatus: "validated",
    });
    expect(bad.ok).toBe(false);
  });
});
