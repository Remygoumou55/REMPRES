import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ERP_APPROVAL_ENGINE_VERSION } from "@/lib/erp-core/approval/version";
import { assertApprovalStatusTransition } from "@/lib/erp-core/approval/lifecycle";
import { ERP_MUTATION_APPROVAL_POLICIES } from "@/lib/erp-core/approval/mutation-policies";
import { evaluateMutationApprovalPolicy } from "@/lib/erp-core/approval/policy-engine";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("B3.1 — ERP Approval Engine", () => {
  it("version officielle", () => {
    expect(ERP_APPROVAL_ENGINE_VERSION).toBe("erp-approval-engine-b3.1-v1");
  });

  it("policy engine — convert_sale requis", () => {
    const p = evaluateMutationApprovalPolicy({
      mutationAction: "crm.quote.convert_sale",
      departmentKey: "VENTE",
      registryRequiresApproval: true,
    });
    expect(p.required).toBe(true);
    expect(p.kind).toBe("governance_required");
  });

  it("policy engine — expense sous seuil auto", () => {
    const p = evaluateMutationApprovalPolicy({
      mutationAction: "finance.expense.create",
      departmentKey: "FINANCE",
      amountGnf: 100_000,
      registryRequiresApproval: true,
    });
    expect(p.required).toBe(false);
  });

  it("lifecycle transitions valides", () => {
    expect(() => assertApprovalStatusTransition("pending", "approved")).not.toThrow();
    expect(() => assertApprovalStatusTransition("approved", "pending")).toThrow();
  });

  it("mutation gate branché CRM write governance", () => {
    const gov = readSrc("lib/vente/runtime/crm-write-governance.ts");
    expect(gov).toContain("assertErpMutationApprovalGate");
    expect(gov).toContain("crm:approval_context_required");
  });

  it("quote conversion fournit approval context", () => {
    const svc = readSrc("modules/crm/server/services/quote-sale-conversion.ts");
    expect(svc).toContain("CRM_APPROVAL_ENTITY_TYPES.quote");
    expect(svc).toContain("assertCrmWriteActionAllowed");
    expect(svc).toContain("total_amount_gnf");
  });

  it("politiques mutation centralisées", () => {
    expect(ERP_MUTATION_APPROVAL_POLICIES["crm.quote.convert_sale"]?.required).toBe(true);
    expect(ERP_MUTATION_APPROVAL_POLICIES["finance.journal.post"]?.required).toBe(true);
  });
});
