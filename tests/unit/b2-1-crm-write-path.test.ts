import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertLeadStatusTransition,
  assertQuoteStatusTransition,
} from "@/lib/vente/runtime/crm-state-machine";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("B2.1 — CRM write path", () => {
  it("autorise new → contacted", () => {
    expect(() => assertLeadStatusTransition("new", "contacted")).not.toThrow();
  });

  it("interdit converted → new", () => {
    expect(() => assertLeadStatusTransition("converted", "new")).toThrow(/terminal/);
  });

  it("interdit draft → converted devis", () => {
    expect(() => assertQuoteStatusTransition("draft", "converted")).toThrow(/forbidden/);
  });

  it("registre CRM entièrement activé (convert_sale = B2.2)", () => {
    const src = readSrc("lib/vente/runtime/crm-write-governance.ts");
    expect(src).toMatch(/QUOTE_CONVERT_SALE[\s\S]*enabled:\s*true/);
    expect(src).toMatch(/LEAD_CREATE[\s\S]*enabled:\s*true/);
    expect(src).toMatch(/OPPORTUNITY_CREATE[\s\S]*enabled:\s*true/);
  });

  it("mutations passent par crm-mutations + actions", () => {
    const mut = readSrc("modules/crm/server/services/crm-mutations.ts");
    const act = readSrc("modules/crm/server/actions/crm-actions.ts");
    expect(mut).toContain("assertCrmWriteActionAllowed");
    expect(act).toContain("createCrmLeadAction");
    expect(mut).toContain("recordCrmGovernanceAudit");
    expect(mut).toContain("emitCrmLeadCreated");
    expect(mut).toContain("emitCrmQuoteCreated");
    expect(mut).toContain("emitCrmQuoteStatusUpdated");
  });
});
