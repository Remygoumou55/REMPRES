import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ERP_EVENT_BUS_VERSION } from "@/lib/erp-core/events/version";
import {
  assertValidEventType,
  OFFICIAL_ERP_EVENT_TYPES,
} from "@/lib/erp-core/events/event-taxonomy";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import {
  registerErpEventHandler,
  clearErpEventHandlersForTests,
} from "@/lib/erp-core/events/event-registry";
import { getRecentEventTraces } from "@/lib/erp-core/events/event-traceability";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("B3.2 — ERP Event Bus", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
  });

  it("version et taxonomie officielle", () => {
    expect(ERP_EVENT_BUS_VERSION).toBe("erp-event-bus-b3.2-v1");
    expect(OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_CREATED).toBe("approval.request.created");
    expect(() => assertValidEventType("bad")).toThrow();
    expect(() => assertValidEventType("crm.quote.converted")).not.toThrow();
  });

  it("publish + subscribe in-process", async () => {
    const received: string[] = [];
    registerErpEventHandler({
      pattern: "approval.*",
      consumerKey: "test-consumer",
      handler: async (e) => {
        received.push(e.type);
      },
    });

    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_CREATED,
      actorUserId: "user-1",
      departmentKey: "VENTE",
      entityType: "approval_requests",
      entityId: "req-1",
      persistAudit: false,
    });

    expect(received).toContain("approval.request.created");
    const traces = getRecentEventTraces(5);
    expect(traces.some((t) => t.phase === "published")).toBe(true);
  });

  it("mutation-gate émet événements approval", () => {
    const src = readSrc("lib/erp-core/approval/mutation-gate.ts");
    expect(src).toContain("emitApprovalRequestCreated");
    expect(src).toContain("emitApprovalGateGranted");
  });

  it("admin approvals émet approved/rejected", () => {
    const src = readSrc("app/(app)/admin/approvals/actions.ts");
    expect(src).toContain("emitApprovalRequestApproved");
    expect(src).toContain("emitApprovalRequestRejected");
  });

  it("quote conversion émet bus convert requested/converted/failed", () => {
    const src = readSrc("modules/crm/server/services/quote-sale-conversion.ts");
    expect(src).toContain("emitCrmQuoteConvertRequested");
    expect(src).toContain("emitCrmQuoteConverted");
    expect(src).toContain("emitRuntimeOrchestrationFailed");
  });
});
