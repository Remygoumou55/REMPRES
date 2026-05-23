import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import {
  deliverInAppNotification,
  resolveGovernanceAlertType,
  mapPriorityToAlertSeverity,
} from "@/lib/erp-core/events/delivery/in-app-notification-service";
import { processNotificationBridgeCandidate } from "@/lib/erp-core/events/handlers/notification-bridge-dispatch";
import { clearNotificationBridgeLogsForTests } from "@/lib/erp-core/events/handlers/notification-bridge-log";

const emitMock = vi.fn();

vi.mock("@/lib/governance/alert-engine", () => ({
  tryEmitGovernanceAlert: (...args: unknown[]) => emitMock(...args),
}));

function readSrc(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("P3 — Notification delivery in_app", () => {
  beforeEach(() => {
    emitMock.mockClear();
    clearNotificationBridgeLogsForTests();
  });

  it("resolveGovernanceAlertType — approval templates", () => {
    expect(
      resolveGovernanceAlertType({
        sourceEventId: "1",
        sourceEventType: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_CREATED,
        departmentKey: "VENTE",
        recipientScope: "super_admin",
        templateKey: "approval.request.created",
        title: "t",
        body: "b",
        priority: "high",
        channels: ["in_app"],
        entityType: "approval_requests",
        entityId: "r1",
        metadata: {},
      }),
    ).toBe("approval_request_created");
  });

  it("mapPriorityToAlertSeverity", () => {
    expect(mapPriorityToAlertSeverity("high")).toBe("high");
    expect(mapPriorityToAlertSeverity("normal")).toBe("medium");
  });

  it("deliverInAppNotification appelle tryEmitGovernanceAlert", async () => {
    const result = await deliverInAppNotification({
      triggeredBy: "user-1",
      candidate: {
        sourceEventId: "evt-1",
        sourceEventType: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
        departmentKey: "VENTE",
        recipientScope: "actor",
        templateKey: "approval.request.approved",
        title: "OK",
        body: "Approuvé",
        priority: "high",
        channels: ["in_app"],
        entityType: "approval_requests",
        entityId: "req-1",
        metadata: { mutationAction: "crm.quote.convert_sale" },
      },
    });
    expect(result.delivered).toBe(true);
    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(emitMock.mock.calls[0]?.[0]?.type).toBe("approval_granted");
  });

  it("processNotificationBridgeCandidate — trace + delivery", async () => {
    await processNotificationBridgeCandidate({
      consumerKey: "test-bridge",
      candidate: {
        sourceEventId: "e2",
        sourceEventType: OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED,
        departmentKey: "VENTE",
        recipientScope: "department",
        templateKey: "crm.lead.created",
        title: "Lead",
        body: "Nouveau",
        priority: "normal",
        channels: ["in_app"],
        entityType: "crm_leads",
        entityId: "lead-1",
        metadata: {},
      },
      triggeredBy: "user-2",
      deliverInApp: true,
      awaitDelivery: true,
    });
    expect(emitMock).toHaveBeenCalled();
  });

  it("mutation-gate et admin approvals sans tryCreateAlert direct", () => {
    expect(readSrc("lib/erp-core/approval/mutation-gate.ts")).not.toContain("tryCreateAlert");
    expect(readSrc("app/(app)/admin/approvals/actions.ts")).not.toContain("tryCreateAlert");
  });
});
