import { describe, expect, it, beforeEach } from "vitest";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import {
  clearErpEventHandlersForTests,
  listErpEventHandlers,
} from "@/lib/erp-core/events/event-registry";
import {
  mapHrEventToNotificationCandidate,
  NOTIFICATION_HR_BRIDGE_CONSUMER_KEY,
  registerNotificationHrBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-hr-bridge";
import {
  clearNotificationBridgeLogsForTests,
  getRecentNotificationBridgeLogs,
} from "@/lib/erp-core/events/handlers/notification-bridge-log";
import { resetErpEventHandlersBootstrapForTests } from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import { resolveGovernanceAlertType } from "@/lib/erp-core/events/delivery/in-app-notification-service";
import { HR_NOTIFICATION_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/hr-notification-readiness-validation";
import { listHrBridgeableActiveNotifications } from "@/lib/erp-core/events/governance/hr-notification-governance-map";
import { getRecentEventTraces } from "@/lib/erp-core/events/event-traceability";

describe("P7.2 — HR notification bridge", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
    clearNotificationBridgeLogsForTests();
    resetErpEventHandlersBootstrapForTests();
  });

  it("mapHrEventToNotificationCandidate — leave requested approvers", () => {
    const candidate = mapHrEventToNotificationCandidate({
      id: "evt-h1",
      type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: "rh-user-1",
      departmentKey: "RH",
      entityType: "leave_request",
      entityId: "leave-1",
      payload: {
        leave_type: "paid",
        start_date: "2026-06-01",
        end_date: "2026-06-10",
      },
      correlationId: "leave-1",
      causationId: null,
    });
    expect(candidate?.templateKey).toBe("hr.leave.requested");
    expect(candidate?.recipientScope).toBe("approvers");
    expect(candidate?.priority).toBe("normal");
  });

  it("mapHrEventToNotificationCandidate — contract expiring department", () => {
    const candidate = mapHrEventToNotificationCandidate({
      id: "evt-h2",
      type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: null,
      departmentKey: "RH",
      entityType: "rh_contract",
      entityId: "ctr-1",
      payload: { end_date: "2026-07-01", days_until_expiry: 14 },
      correlationId: "ctr-1",
      causationId: null,
    });
    expect(candidate?.templateKey).toBe("hr.contract.expiring");
    expect(candidate?.recipientScope).toBe("department");
    expect(candidate?.priority).toBe("high");
  });

  it("mapHrEventToNotificationCandidate — employee.updated ignored", () => {
    const candidate = mapHrEventToNotificationCandidate({
      id: "evt-h3",
      type: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: "rh-admin",
      departmentKey: "RH",
      entityType: "profiles",
      entityId: "emp-1",
      payload: { field: "role" },
      correlationId: "emp-1",
      causationId: null,
    });
    expect(candidate).toBeNull();
  });

  it("resolveGovernanceAlertType — hr templates", () => {
    expect(
      resolveGovernanceAlertType({
        sourceEventId: "1",
        sourceEventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
        departmentKey: "RH",
        recipientScope: "approvers",
        templateKey: "hr.leave.requested",
        title: "t",
        body: "b",
        priority: "normal",
        channels: ["in_app"],
        entityType: "leave_request",
        entityId: "l1",
        metadata: {},
      }),
    ).toBe("hr_leave_requested");
  });

  it("handler hr.* — projection ring buffer", async () => {
    registerNotificationHrBridgeHandler();

    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
      actorUserId: "rh-mgr",
      departmentKey: "RH",
      entityType: "leave_request",
      entityId: "leave-2",
      payload: { employee_id: "emp-2", from_status: "pending", to_status: "approved" },
      persistAudit: false,
      awaitDispatch: true,
    });

    const logs = getRecentNotificationBridgeLogs(5);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.consumerKey).toBe(NOTIFICATION_HR_BRIDGE_CONSUMER_KEY);
    expect(logs[0]?.candidate.templateKey).toBe("hr.leave.approved");

    const traces = getRecentEventTraces(15);
    expect(
      traces.some(
        (t) => t.phase === "handler_ok" && t.consumerKey === NOTIFICATION_HR_BRIDGE_CONSUMER_KEY,
      ),
    ).toBe(true);
  });

  it("bootstrap — enregistre notification-hr-bridge au publish", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
      actorUserId: "rh-user-2",
      departmentKey: "RH",
      entityType: "leave_request",
      entityId: "leave-3",
      payload: { leave_type: "sick", start_date: "2026-08-01", end_date: "2026-08-03" },
      persistAudit: false,
      awaitDispatch: true,
    });

    const handlers = listErpEventHandlers();
    expect(handlers.some((h) => h.consumerKey === NOTIFICATION_HR_BRIDGE_CONSUMER_KEY)).toBe(true);
    expect(handlers.some((h) => h.consumerKey === "notification-finance-bridge")).toBe(true);
  });

  it("governance — 3 bridgeable active", () => {
    expect(listHrBridgeableActiveNotifications()).toHaveLength(3);
  });

  it("readiness P7.2 — READY", () => {
    expect(HR_NOTIFICATION_READINESS_VERDICT.p72BridgeReady).toBe(true);
  });
});
