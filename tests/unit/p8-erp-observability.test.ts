import { describe, expect, it, beforeEach } from "vitest";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import { clearErpEventHandlersForTests } from "@/lib/erp-core/events/event-registry";
import { clearEventTracesForTests } from "@/lib/erp-core/events/event-traceability";
import { clearNotificationBridgeLogsForTests } from "@/lib/erp-core/events/handlers/notification-bridge-log";
import { clearAutomationTracesForTests } from "@/lib/erp-core/events/automation/automation-trace-log";
import { registerNotificationHrBridgeHandler } from "@/lib/erp-core/events/handlers/notification-hr-bridge";
import { BUS_TRACE_MAP, mapEventTraceToBusTraceView } from "@/lib/erp-core/observability/bus/bus-trace-foundation";
import { readRecentBusTraces } from "@/lib/erp-core/observability/bus/bus-trace-read";
import { getErpObservabilitySnapshot } from "@/lib/erp-core/observability/runtime/observability-runtime";
import {
  eventTypeAllowedForScope,
  type ObservabilityVisibilityScope,
} from "@/lib/erp-core/observability/security/observability-security-model";
import { OBSERVABILITY_READINESS_VERDICT } from "@/lib/erp-core/observability/foundation/observability-readiness-validation";
import { OBSERVABILITY_API_MAP } from "@/lib/erp-core/observability/foundation/observability-api-map";

const financeScope: ObservabilityVisibilityScope = {
  roleClass: "finance",
  mode: "domain_prefixes",
  allowedPrefixes: ["finance.", "approval."],
  payloadRedaction: "metadata_only",
};

const allScope: ObservabilityVisibilityScope = {
  roleClass: "super_admin",
  mode: "all",
  allowedPrefixes: null,
  payloadRedaction: "none",
};

describe("P8 — ERP bus observability", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
    clearEventTracesForTests();
    clearNotificationBridgeLogsForTests();
    clearAutomationTracesForTests();
  });

  it("BUS_TRACE_MAP — 4 lifecycle phases", () => {
    expect(BUS_TRACE_MAP).toHaveLength(4);
    expect(BUS_TRACE_MAP.map((m) => m.lifecyclePhase)).toContain("event_published");
  });

  it("security — finance scope filters hr events", () => {
    expect(eventTypeAllowedForScope("finance.expense.created", financeScope)).toBe(true);
    expect(eventTypeAllowedForScope("hr.leave.requested", financeScope)).toBe(false);
    expect(eventTypeAllowedForScope("approval.request.created", financeScope)).toBe(true);
  });

  it("getErpObservabilitySnapshot — handlers + structure", () => {
    registerNotificationHrBridgeHandler();
    const snapshot = getErpObservabilitySnapshot(allScope);
    expect(snapshot.version).toBe("observability-runtime-p8-v1");
    expect(snapshot.handlers.count).toBeGreaterThanOrEqual(1);
    expect(snapshot.bus.catalogVersion).toContain("erp-event-catalog");
  });

  it("publish event — appears in bus traces", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED,
      actorUserId: "obs-user",
      departmentKey: "VENTE",
      entityType: "crm_lead",
      entityId: "lead-1",
      payload: {},
      persistAudit: false,
      awaitDispatch: true,
    });
    const traces = readRecentBusTraces(10);
    expect(traces.some((t) => t.eventType === "crm.lead.created")).toBe(true);
    expect(traces[0]?.lifecyclePhase).toBeDefined();
    expect(mapEventTraceToBusTraceView({
      id: "t1",
      phase: "published",
      eventId: "e1",
      eventType: "crm.lead.created",
      at: new Date().toISOString(),
    }).lifecyclePhase).toBe("event_published");
  });

  it("scoped snapshot — finance sees finance only", async () => {
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
      actorUserId: "fin-1",
      departmentKey: "FINANCE",
      entityType: "expenses",
      entityId: "e1",
      payload: { amount_gnf: 100 },
      persistAudit: false,
      awaitDispatch: false,
    });
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
      actorUserId: "rh-1",
      departmentKey: "RH",
      entityType: "leave_request",
      entityId: "l1",
      payload: {},
      persistAudit: false,
      awaitDispatch: false,
    });

    const finSnap = getErpObservabilitySnapshot(financeScope);
    const types = finSnap.recentEvents.map((e) => e.eventType);
    expect(types.some((t) => t.startsWith("finance."))).toBe(true);
    expect(types.some((t) => t.startsWith("hr."))).toBe(false);
  });

  it("API map — 5 GET endpoints", () => {
    expect(OBSERVABILITY_API_MAP).toHaveLength(5);
    expect(OBSERVABILITY_API_MAP.every((e) => e.method === "GET")).toBe(true);
  });

  it("readiness P8 — READY", () => {
    expect(OBSERVABILITY_READINESS_VERDICT.overall).toBe("READY");
  });
});
