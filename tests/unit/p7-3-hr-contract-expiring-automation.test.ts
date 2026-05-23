import { describe, expect, it, beforeEach, vi } from "vitest";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import {
  clearErpEventHandlersForTests,
} from "@/lib/erp-core/events/event-registry";
import {
  matchAutomationRules,
  clearAutomationEngineStateForTests,
} from "@/lib/erp-core/events/automation/automation-rule-engine";
import {
  clearAutomationCooldownForTests,
} from "@/lib/erp-core/events/automation/automation-safety";
import {
  clearAutomationTracesForTests,
  getRecentAutomationTraces,
} from "@/lib/erp-core/events/automation/automation-trace-log";
import { ERP_AUTOMATION_RULES } from "@/lib/erp-core/events/automation/automation-governance";
import { HR_AUTOMATION_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/hr-automation-readiness-validation";
import {
  registerErpAutomationEngineHandler,
} from "@/lib/erp-core/events/handlers/automation-engine-handler";
import {
  registerNotificationHrBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-hr-bridge";
import {
  clearNotificationBridgeLogsForTests,
  getRecentNotificationBridgeLogs,
} from "@/lib/erp-core/events/handlers/notification-bridge-log";
import {
  resetErpEventHandlersBootstrapForTests,
} from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import {
  computeDaysUntilExpiry,
  clearHrContractExpiryEmissionCooldownForTests,
  evaluateAndEmitHrContractExpiringEvents,
  isHrContractExpiryCandidate,
} from "@/lib/hr/runtime/hr-contract-expiry-evaluator";
import { listHrGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";

const emitHrContractExpiring = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/erp-core/events/integrations/hr-events", () => ({
  emitHrContractExpiring: (...args: unknown[]) => emitHrContractExpiring(...args),
}));

describe("P7.3 — HR contract expiring + automation", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
    clearAutomationTracesForTests();
    clearAutomationCooldownForTests();
    clearAutomationEngineStateForTests();
    clearNotificationBridgeLogsForTests();
    clearHrContractExpiryEmissionCooldownForTests();
    resetErpEventHandlersBootstrapForTests();
    emitHrContractExpiring.mockClear();
  });

  it("isHrContractExpiryCandidate — active in renewal window", () => {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 20);
    const endDate = in30Days.toISOString().slice(0, 10);
    expect(
      isHrContractExpiryCandidate({
        id: "c1",
        employeeId: "e1",
        endDate,
        renewalWindowDays: 30,
        status: "active",
      }),
    ).toBe(true);
    expect(computeDaysUntilExpiry(endDate)).toBeGreaterThan(0);
  });

  it("evaluateAndEmitHrContractExpiringEvents — emits once per contract", async () => {
    const in10Days = new Date();
    in10Days.setDate(in10Days.getDate() + 10);
    const endDate = in10Days.toISOString().slice(0, 10);

    const result = await evaluateAndEmitHrContractExpiringEvents(
      [
      {
        id: "ctr-1",
        employeeId: "emp-1",
        endDate,
        renewalWindowDays: 30,
        status: "active",
      },
      ],
      { actorUserId: "rh-eval-user" },
    );

    expect(result.emitted).toEqual(["ctr-1"]);
    expect(emitHrContractExpiring).toHaveBeenCalledTimes(1);
    expect(emitHrContractExpiring).toHaveBeenCalledWith(
      expect.objectContaining({
        contractId: "ctr-1",
        employeeId: "emp-1",
        endDate,
      }),
    );

    const second = await evaluateAndEmitHrContractExpiringEvents(
      [
        {
          id: "ctr-1",
          employeeId: "emp-1",
          endDate,
          renewalWindowDays: 30,
          status: "active",
        },
      ],
      { actorUserId: "rh-eval-user" },
    );
    expect(second.skippedCooldown).toContain("ctr-1");
    expect(emitHrContractExpiring).toHaveBeenCalledTimes(1);
  });

  it("matchAutomationRules — hr contract expiring + leave approved", () => {
    const hrRules = matchAutomationRules({
      id: "e-hr-1",
      type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: "rh-system-test",
      departmentKey: "RH",
      entityType: "rh_contract",
      entityId: "ctr-2",
      payload: { days_until_expiry: 7 },
      correlationId: "ctr-2",
      causationId: null,
    });
    expect(hrRules.map((r) => r.key)).toContain("hr.contract.expiring.reminder");

    const leaveRules = matchAutomationRules({
      id: "e-hr-2",
      type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: "mgr-1",
      departmentKey: "RH",
      entityType: "leave_request",
      entityId: "leave-1",
      payload: {},
      correlationId: "leave-1",
      causationId: null,
    });
    expect(leaveRules.map((r) => r.key)).toContain("hr.leave.approved.post");
  });

  it("ERP_AUTOMATION_RULES — 5 règles actives (P6 + P7.3)", () => {
    expect(ERP_AUTOMATION_RULES.filter((r) => r.status === "active")).toHaveLength(5);
  });

  it("bus pipeline — expiring → bridge + automation trace", async () => {
    registerNotificationHrBridgeHandler();
    registerErpAutomationEngineHandler();

    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
      actorUserId: "rh-system-test",
      departmentKey: "RH",
      entityType: "rh_contract",
      entityId: "ctr-pipe",
      payload: {
        contract_id: "ctr-pipe",
        employee_id: "emp-pipe",
        end_date: "2026-12-01",
        days_until_expiry: 14,
      },
      persistAudit: false,
      awaitDispatch: true,
    });

    const bridgeLogs = getRecentNotificationBridgeLogs(3);
    expect(bridgeLogs[0]?.candidate.templateKey).toBe("hr.contract.expiring");

    const traces = getRecentAutomationTraces(5);
    expect(
      traces.some((t) => t.detail === "hr_contract_expiring_reminder"),
    ).toBe(true);
  });

  it("catalogue — hr.contract.expiring active", () => {
    const entry = listHrGovernanceEvents().find(
      (e) => e.type === OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    );
    expect(entry?.status).toBe("active");
  });

  it("readiness P7.3 — READY", () => {
    expect(HR_AUTOMATION_READINESS_VERDICT.p73AutomationReady).toBe(true);
  });
});
