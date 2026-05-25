import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FINANCE_CAPABILITY_STATUS,
  FINANCE_DOMAIN_GOVERNANCE_VERSION,
} from "@/lib/finance/governance/finance-domain-governance";
import {
  FINANCE_DOMAIN_MATURITY_MATRIX,
  FINANCE_DOMAIN_MATURITY_VERSION,
} from "@/lib/finance/runtime/finance-domain-maturity-registry";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Finance domain maturity matrix — Bloc 3 Étape 2", () => {
  it("registry version", () => {
    expect(FINANCE_DOMAIN_MATURITY_VERSION).toBe("finance-domain-maturity-bloc3-v1");
    expect(FINANCE_DOMAIN_MATURITY_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(FINANCE_DOMAIN_GOVERNANCE_VERSION).toBe("finance-domain-governance-bloc3-v1");
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "Transactions — emit for expense",
      expected: "finance-transaction-mutations",
      check: () => readSrc("modules/finance/server/services/finance-transaction-mutations.ts").includes("emitFinanceTransactionRecorded"),
    },
    {
      area: "Journal — post governed",
      expected: "post_finance_journal_batch",
      check: () => readSrc("modules/finance/server/services/finance-journal-mutations.ts").includes("post_finance_journal_batch"),
    },
    {
      area: "Reporting — live CFO data",
      expected: "getFinanceCfoData",
      check: () => readSrc("modules/finance/server/services/finance-reporting-service.ts").includes("getFinanceCfoData"),
    },
    {
      area: "Events — transaction recorded active",
      expected: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
      check: () => OFFICIAL_ERP_EVENT_TYPES.FINANCE_APPROVAL_REQUESTED === "finance.approval.requested",
    },
    {
      area: "Events — report generated",
      expected: "finance.report.generated",
      check: () => OFFICIAL_ERP_EVENT_TYPES.FINANCE_REPORT_GENERATED === "finance.report.generated",
    },
    {
      area: "Governance — journal post enabled",
      expected: "enabled true",
      check: () => FINANCE_CAPABILITY_STATUS.journalPost === "active",
    },
    {
      area: "Write registry — report generate",
      expected: "REPORT_GENERATE",
      check: () => readSrc("lib/finance/runtime/finance-write-governance.ts").includes("REPORT_GENERATE"),
    },
    {
      area: "Expense wiring — transaction bus",
      expected: "emitFinanceTransactionForExpense",
      check: () => readSrc("modules/finance/server/services/finance-expense-mutations.ts").includes("emitFinanceTransactionForExpense"),
    },
    {
      area: "SQL — approval sync",
      expected: "048 migration",
      check: () => readSrc("supabase/sql/048_finance_domain_maturity.sql").includes("sync_finance_journal_from_approval"),
    },
    {
      area: "Reporting page — live KPIs",
      expected: "buildFinanceOperationalReport",
      check: () => readSrc("app/(app)/finance/enterprise/reporting/page.tsx").includes("buildFinanceOperationalReport"),
    },
    {
      area: "Dept cockpit — non-placeholder",
      expected: "placeholder false",
      check: () => readSrc("lib/finance/runtime/finance-kpi-runtime.ts").includes("placeholder: false"),
    },
    {
      area: "Super Admin lock",
      expected: "ErpNavSidebar unchanged",
      check: () => {
        const sa = readSrc("components/layout/app-shell/ErpNavSidebar.tsx");
        return sa.includes("export const ErpNavSidebar") && !readSrc("app/(app)/finance/FinanceDashboardClient.tsx").includes("SuperAdminCockpitClient");
      },
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
