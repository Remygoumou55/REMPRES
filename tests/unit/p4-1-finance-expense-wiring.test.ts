import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import { listFinanceGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { FINANCE_MUTATION_INTEGRATION_TABLE } from "@/lib/erp-core/events/foundation/finance-mutation-integration-plan";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("P4.1 — Finance expense wiring", () => {
  it("registry — expense create/update enabled", () => {
    const reg = readSrc("lib/finance/runtime/finance-write-governance.ts");
    expect(reg).toMatch(/EXPENSE_CREATE[\s\S]*enabled:\s*true/);
    expect(reg).toMatch(/EXPENSE_UPDATE[\s\S]*enabled:\s*true/);
    expect(reg).toMatch(/JOURNAL_POST[\s\S]*enabled:\s*false/);
  });

  it("finance-expense-mutations — gate, emit, audit", () => {
    const src = readSrc("modules/finance/server/services/finance-expense-mutations.ts");
    expect(src).toContain("assertFinanceWriteActionAllowed");
    expect(src).toContain("emitFinanceExpenseCreated");
    expect(src).toContain("emitFinanceExpenseUpdated");
    expect(src).toContain("recordFinanceGovernanceAudit");
    expect(src).toContain("Promise.all");
  });

  it("depenses actions — délègue finance mutations", () => {
    const actions = readSrc("app/(app)/finance/depenses/actions.ts");
    expect(actions).toContain("createFinanceExpense");
    expect(actions).toContain("updateFinanceExpense");
    expect(actions).not.toMatch(/await createExpense\(/);
    expect(actions).toContain("assertApprovalOrThrow");
  });

  it("catalogue — expense events active", () => {
    const finance = listFinanceGovernanceEvents();
    const active = finance.filter((e) => e.status === "active");
    expect(active.map((e) => e.type)).toEqual(
      expect.arrayContaining([
        OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
        OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED,
      ]),
    );
  });

  it("integration table — 2 mutations done", () => {
    const done = FINANCE_MUTATION_INTEGRATION_TABLE.filter((r) => r.integrationPhase === "done");
    expect(done.length).toBeGreaterThanOrEqual(2);
    expect(done.some((r) => r.mutationAction === "finance.expense.create")).toBe(true);
    expect(done.some((r) => r.mutationAction === "finance.expense.update")).toBe(true);
  });

  it("publish finance.expense.created — bus trace", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
      actorUserId: "fin-user-1",
      departmentKey: "FINANCE",
      entityType: "expenses",
      entityId: "exp-1",
      payload: { expense_id: "exp-1", amount_gnf: 50000, status: "active" },
      persistAudit: false,
      awaitDispatch: true,
    });
    expect(true).toBe(true);
  });
});
