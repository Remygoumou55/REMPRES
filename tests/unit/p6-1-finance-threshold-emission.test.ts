import { describe, expect, it, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import {
  isFinanceThresholdExceeded,
  evaluateAndEmitFinanceTreasuryThresholds,
  clearFinanceThresholdEmissionCooldownForTests,
} from "@/lib/finance/runtime/finance-threshold-evaluator";
import {
  clearAutomationTracesForTests,
  getRecentAutomationTraces,
} from "@/lib/erp-core/events/automation/automation-trace-log";
import {
  clearNotificationBridgeLogsForTests,
  getRecentNotificationBridgeLogs,
} from "@/lib/erp-core/events/handlers/notification-bridge-log";
import { clearErpEventHandlersForTests } from "@/lib/erp-core/events/event-registry";
import { resetErpEventHandlersBootstrapForTests } from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";

const emitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/erp-core/events/integrations/finance-events", () => ({
  emitFinanceExpenseCreated: vi.fn(),
  emitFinanceExpenseUpdated: vi.fn(),
  emitFinanceThresholdExceeded: (...args: unknown[]) => emitMock(...args),
}));

function treasuryFixture(overrides: Partial<{
  profitMonth: number;
  expensesMonth: number;
  expensesToday: number;
}> = {}) {
  return {
    source: "finance-treasury-runtime-v1",
    generatedAt: new Date().toISOString(),
    netRevenueToday: 0,
    netRevenueMonth: 0,
    grossRevenueMonth: 0,
    cancelledRevenueMonth: 0,
    expensesMonth: overrides.expensesMonth ?? 0,
    profitMonth: overrides.profitMonth ?? 100,
    marginPctMonth: 10,
    expensesToday: overrides.expensesToday ?? 0,
    profitToday: 0,
    treasuryLast7Days: [],
  };
}

describe("P6.1 — Finance threshold emission", () => {
  beforeEach(() => {
    emitMock.mockClear();
    clearFinanceThresholdEmissionCooldownForTests();
    clearErpEventHandlersForTests();
    clearAutomationTracesForTests();
    clearNotificationBridgeLogsForTests();
    resetErpEventHandlersBootstrapForTests();
  });

  it("isFinanceThresholdExceeded — profit négatif", () => {
    const t = treasuryFixture({ profitMonth: -1 });
    expect(
      isFinanceThresholdExceeded(
        {
          key: "cfo_negative_profit_month",
          description: "x",
          metric: "profitMonth",
          compare: "below",
          thresholdGnf: 0,
          period: "month",
          enabled: true,
        },
        t,
      ),
    ).toBe(true);
  });

  it("evaluateAndEmit — émet profit négatif", async () => {
    const result = await evaluateAndEmitFinanceTreasuryThresholds(
      treasuryFixture({ profitMonth: -5000 }),
      { actorUserId: "fin-user" },
    );
    expect(result.emitted).toContain("cfo_negative_profit_month");
    expect(emitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        thresholdKey: "cfo_negative_profit_month",
        actorUserId: "fin-user",
      }),
    );
  });

  it("cooldown — pas de double émission immédiate", async () => {
    const t = treasuryFixture({ profitMonth: -100 });
    await evaluateAndEmitFinanceTreasuryThresholds(t, { actorUserId: "u1" });
    const second = await evaluateAndEmitFinanceTreasuryThresholds(t, { actorUserId: "u1" });
    expect(second.skippedCooldown.length).toBeGreaterThan(0);
    expect(emitMock.mock.calls.filter((c) => c[0]?.thresholdKey === "cfo_negative_profit_month")).toHaveLength(
      1,
    );
  });

  it("finance-kpi-runtime — fire-and-forget evaluator", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/finance/runtime/finance-kpi-runtime.ts"),
      "utf8",
    );
    expect(src).toContain("evaluateAndEmitFinanceTreasuryThresholds");
    expect(src).toContain("actorUserId: userId");
  });

  it("chaîne bus — publish déclenche bridge + automation", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
      actorUserId: "fin-chain",
      departmentKey: "FINANCE",
      entityType: "finance_threshold",
      entityId: "cfo_negative_profit_month",
      payload: {
        threshold_key: "cfo_negative_profit_month",
        threshold_gnf: 0,
        actual_gnf: -1000,
      },
      persistAudit: false,
      awaitDispatch: true,
    });

    expect(getRecentNotificationBridgeLogs(3).some((l) => l.candidate.templateKey === "finance.threshold.exceeded")).toBe(
      true,
    );
    expect(
      getRecentAutomationTraces(5).some((t) => t.ruleKey === "finance.threshold.exceeded.notify_cfo"),
    ).toBe(true);
  });
});
