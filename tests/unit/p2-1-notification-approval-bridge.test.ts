import { describe, expect, it, beforeEach } from "vitest";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import { clearErpEventHandlersForTests, listErpEventHandlers } from "@/lib/erp-core/events/event-registry";
import {
  mapApprovalEventToNotificationCandidate,
  NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY,
  registerNotificationApprovalBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-approval-bridge";
import {
  clearNotificationBridgeLogsForTests,
  getRecentNotificationBridgeLogs,
} from "@/lib/erp-core/events/handlers/notification-bridge-log";
import { resetErpEventHandlersBootstrapForTests } from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import { getRecentEventTraces } from "@/lib/erp-core/events/event-traceability";

describe("P2.1 — Notification approval bridge (read-only)", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
    clearNotificationBridgeLogsForTests();
    resetErpEventHandlersBootstrapForTests();
  });

  it("mapApprovalEventToNotificationCandidate — request created", () => {
    const candidate = mapApprovalEventToNotificationCandidate({
      id: "evt-a1",
      type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_CREATED,
      version: "erp-event-bus-b3.2-v1",
      family: "approval",
      sensitivity: "internal",
      occurredAt: new Date().toISOString(),
      actorUserId: "user-1",
      departmentKey: "VENTE",
      entityType: "approval_requests",
      entityId: "req-abc12345",
      payload: { mutationAction: "crm.quote.convert_sale" },
      correlationId: "req-abc12345",
      causationId: null,
    });
    expect(candidate?.templateKey).toBe("approval.request.created");
    expect(candidate?.recipientScope).toBe("super_admin");
    expect(candidate?.priority).toBe("high");
  });

  it("handler approval.* — projection read-only", async () => {
    registerNotificationApprovalBridgeHandler();

    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
      actorUserId: "sa-1",
      departmentKey: "VENTE",
      entityType: "approval_requests",
      entityId: "req-1",
      payload: { mutationAction: "crm.quote.convert_sale" },
      persistAudit: false,
      awaitDispatch: true,
    });

    const logs = getRecentNotificationBridgeLogs(5);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.consumerKey).toBe(NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY);
    expect(logs[0]?.candidate.templateKey).toBe("approval.request.approved");

    const traces = getRecentEventTraces(10);
    expect(
      traces.some(
        (t) => t.phase === "handler_ok" && t.consumerKey === NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY,
      ),
    ).toBe(true);
  });

  it("bootstrap — enregistre approval + crm bridges", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_GATE_GRANTED,
      actorUserId: "user-1",
      departmentKey: "FINANCE",
      entityType: "approval_requests",
      entityId: "req-fin",
      payload: { mutationAction: "finance.journal.post" },
      persistAudit: false,
      awaitDispatch: true,
    });

    const keys = listErpEventHandlers().map((h) => h.consumerKey);
    expect(keys).toContain(NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY);
    expect(keys).toContain("notification-crm-bridge");
    expect(getRecentNotificationBridgeLogs(1)[0]?.candidate.templateKey).toBe("approval.gate.granted");
  });

  it("cross-department — pas de departmentScope sur approval bridge", () => {
    registerNotificationApprovalBridgeHandler();
    const reg = listErpEventHandlers().find((h) => h.consumerKey === NOTIFICATION_APPROVAL_BRIDGE_CONSUMER_KEY);
    expect(reg?.departmentScope).toBeNull();
  });

  it("mutation.blocked.pending — hors pattern approval.* (non mappé ici)", () => {
    expect(
      mapApprovalEventToNotificationCandidate({
        id: "m1",
        type: OFFICIAL_ERP_EVENT_TYPES.MUTATION_BLOCKED_PENDING,
        version: "erp-event-bus-b3.2-v1",
        family: "mutation",
        sensitivity: "internal",
        occurredAt: new Date().toISOString(),
        actorUserId: "u",
        departmentKey: "VENTE",
        entityType: "approval_requests",
        entityId: "r1",
        payload: { mutationAction: "crm.quote.convert_sale" },
        correlationId: null,
        causationId: null,
      }),
    ).toBeNull();
  });
});
