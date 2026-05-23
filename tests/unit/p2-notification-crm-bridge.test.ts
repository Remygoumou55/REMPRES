import { describe, expect, it, beforeEach } from "vitest";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import {
  clearErpEventHandlersForTests,
  listErpEventHandlers,
} from "@/lib/erp-core/events/event-registry";
import {
  mapCrmEventToNotificationCandidate,
  NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY,
  registerNotificationCrmBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-crm-bridge";
import {
  clearNotificationBridgeLogsForTests,
  getRecentNotificationBridgeLogs,
} from "@/lib/erp-core/events/handlers/notification-bridge-log";
import {
  ensureErpEventHandlersBootstrapped,
  resetErpEventHandlersBootstrapForTests,
} from "@/lib/erp-core/events/bootstrap/register-default-handlers";
import { getRecentEventTraces } from "@/lib/erp-core/events/event-traceability";

describe("P2 — Notification CRM bridge (read-only)", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
    clearNotificationBridgeLogsForTests();
    resetErpEventHandlersBootstrapForTests();
  });

  it("mapCrmEventToNotificationCandidate — lead created", () => {
    const candidate = mapCrmEventToNotificationCandidate({
      id: "evt-1",
      type: OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "internal",
      occurredAt: new Date().toISOString(),
      actorUserId: "user-1",
      departmentKey: "VENTE",
      entityType: "crm_leads",
      entityId: "lead-1",
      payload: { company_name: "Acme GN" },
      correlationId: "lead-1",
      causationId: null,
    });
    expect(candidate?.templateKey).toBe("crm.lead.created");
    expect(candidate?.priority).toBe("normal");
  });

  it("handler crm.* — projection read-only dans ring buffer", async () => {
    registerNotificationCrmBridgeHandler();

    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CREATED,
      actorUserId: "user-1",
      departmentKey: "VENTE",
      entityType: "crm_quotes",
      entityId: "quote-1",
      payload: { quote_number: "DEV-001", client_id: "c1", status: "draft" },
      persistAudit: false,
      awaitDispatch: true,
    });

    const logs = getRecentNotificationBridgeLogs(5);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.consumerKey).toBe(NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY);
    expect(logs[0]?.mode).toBe("read_only");
    expect(logs[0]?.candidate.templateKey).toBe("crm.quote.created");

    const traces = getRecentEventTraces(10);
    expect(traces.some((t) => t.phase === "handler_ok" && t.consumerKey === NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY)).toBe(
      true,
    );
  });

  it("bootstrap — enregistre notification-crm-bridge au publish", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED,
      actorUserId: "user-1",
      departmentKey: "VENTE",
      entityType: "crm_leads",
      entityId: "lead-2",
      payload: { status: "new" },
      persistAudit: false,
      awaitDispatch: true,
    });

    const handlers = listErpEventHandlers();
    expect(handlers.some((h) => h.consumerKey === NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY)).toBe(true);
    expect(getRecentNotificationBridgeLogs(1)).toHaveLength(1);
  });

  it("bootstrap idempotent", () => {
    ensureErpEventHandlersBootstrapped();
    ensureErpEventHandlersBootstrapped();
    expect(listErpEventHandlers().filter((h) => h.consumerKey === NOTIFICATION_CRM_BRIDGE_CONSUMER_KEY)).toHaveLength(
      1,
    );
  });

  it("ignore événements non mappés crm.* futurs", async () => {
    registerNotificationCrmBridgeHandler();
    // Type valide pattern mais hors switch → null mapper via handler early return
    // Utilise un type crm fictif via publish avec family domain - must be official or pattern test
    // Handler returns null for unknown - test with mapped vs unmapped via direct map
    expect(
      mapCrmEventToNotificationCandidate({
        id: "x",
        type: "crm.unknown.action",
        version: "erp-event-bus-b3.2-v1",
        family: "domain",
        sensitivity: "internal",
        occurredAt: new Date().toISOString(),
        actorUserId: "u",
        departmentKey: "VENTE",
        entityType: "crm_x",
        entityId: "1",
        payload: {},
        correlationId: null,
        causationId: null,
      }),
    ).toBeNull();
  });
});
