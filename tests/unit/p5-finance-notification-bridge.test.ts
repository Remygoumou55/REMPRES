import { describe, expect, it, beforeEach } from "vitest";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import {
  clearErpEventHandlersForTests,
  listErpEventHandlers,
} from "@/lib/erp-core/events/event-registry";
import {
  mapFinanceEventToNotificationCandidate,
  NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY,
  registerNotificationFinanceBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-finance-bridge";
import {
  clearNotificationBridgeLogsForTests,
  getRecentNotificationBridgeLogs,
} from "@/lib/erp-core/events/handlers/notification-bridge-log";
import {
  ensureErpEventHandlersBootstrapped,
  resetErpEventHandlersBootstrapForTests,
} from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import { resolveGovernanceAlertType } from "@/lib/erp-core/events/delivery/in-app-notification-service";
import { FINANCE_NOTIFICATION_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/finance-notification-readiness-validation";
import { getRecentEventTraces } from "@/lib/erp-core/events/event-traceability";

describe("P5 — Finance notification bridge", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
    clearNotificationBridgeLogsForTests();
    resetErpEventHandlersBootstrapForTests();
  });

  it("mapFinanceEventToNotificationCandidate — expense created", () => {
    const candidate = mapFinanceEventToNotificationCandidate({
      id: "evt-f1",
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: "fin-1",
      departmentKey: "FINANCE",
      entityType: "expenses",
      entityId: "exp-1",
      payload: { amount_gnf: 125000, category: "Transport" },
      correlationId: "exp-1",
      causationId: null,
    });
    expect(candidate?.templateKey).toBe("finance.expense.created");
    expect(candidate?.recipientScope).toBe("department");
    expect(candidate?.priority).toBe("normal");
  });

  it("mapFinanceEventToNotificationCandidate — threshold exceeded CFO", () => {
    const candidate = mapFinanceEventToNotificationCandidate({
      id: "evt-f2",
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: null,
      departmentKey: "FINANCE",
      entityType: "finance_threshold",
      entityId: "treasury_daily",
      payload: { threshold_key: "cfo_daily", threshold_gnf: 1_000_000, actual_gnf: 1_500_000 },
      correlationId: "treasury_daily",
      causationId: null,
    });
    expect(candidate?.templateKey).toBe("finance.threshold.exceeded");
    expect(candidate?.recipientScope).toBe("super_admin");
    expect(candidate?.priority).toBe("high");
  });

  it("resolveGovernanceAlertType — finance templates", () => {
    expect(
      resolveGovernanceAlertType({
        sourceEventId: "1",
        sourceEventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
        departmentKey: "FINANCE",
        recipientScope: "department",
        templateKey: "finance.expense.created",
        title: "t",
        body: "b",
        priority: "normal",
        channels: ["in_app"],
        entityType: "expenses",
        entityId: "e1",
        metadata: {},
      }),
    ).toBe("finance_expense_created");
  });

  it("handler finance.* — projection ring buffer", async () => {
    registerNotificationFinanceBridgeHandler();

    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED,
      actorUserId: "fin-2",
      departmentKey: "FINANCE",
      entityType: "expenses",
      entityId: "exp-2",
      payload: { amount_gnf: 50000 },
      persistAudit: false,
      awaitDispatch: true,
    });

    const logs = getRecentNotificationBridgeLogs(5);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.consumerKey).toBe(NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY);
    expect(logs[0]?.candidate.templateKey).toBe("finance.expense.updated");

    const traces = getRecentEventTraces(15);
    expect(
      traces.some(
        (t) => t.phase === "handler_ok" && t.consumerKey === NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY,
      ),
    ).toBe(true);
  });

  it("bootstrap — enregistre notification-finance-bridge au publish", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
      actorUserId: "fin-3",
      departmentKey: "FINANCE",
      entityType: "expenses",
      entityId: "exp-3",
      payload: { amount_gnf: 1000 },
      persistAudit: false,
      awaitDispatch: true,
    });

    const handlers = listErpEventHandlers();
    expect(handlers.some((h) => h.consumerKey === NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY)).toBe(
      true,
    );
    expect(handlers.some((h) => h.consumerKey === "notification-crm-bridge")).toBe(true);
    expect(handlers.some((h) => h.consumerKey === "notification-approval-bridge")).toBe(true);
  });

  it("bootstrap idempotent — un seul handler finance", () => {
    ensureErpEventHandlersBootstrapped();
    ensureErpEventHandlersBootstrapped();
    expect(
      listErpEventHandlers().filter((h) => h.consumerKey === NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY),
    ).toHaveLength(1);
  });

  it("readiness P5 — READY", () => {
    expect(FINANCE_NOTIFICATION_READINESS_VERDICT.p5BridgeReady).toBe(true);
  });
});
