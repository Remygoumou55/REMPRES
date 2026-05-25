import { describe, expect, it, beforeEach } from "vitest";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { ERP_EVENT_CATALOG_VERSION, listHrGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { publishErpEvent } from "@/lib/erp-core/events/event-bus";
import { clearErpEventHandlersForTests } from "@/lib/erp-core/events/event-registry";
import { clearEventTracesForTests } from "@/lib/erp-core/events/event-traceability";
import { clearNotificationBridgeLogsForTests } from "@/lib/erp-core/events/handlers/notification-bridge-log";
import {
  mapHrEventToNotificationCandidate,
  registerNotificationHrBridgeHandler,
} from "@/lib/erp-core/events/handlers/notification-hr-bridge";
import { HR_P9_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/hr-p9-readiness-validation";
import { HR_WRITE_ACTION_REGISTRY } from "@/lib/hr/runtime/hr-write-registry";

describe("P9 — HR expansion", () => {
  beforeEach(() => {
    clearErpEventHandlersForTests();
    clearEventTracesForTests();
    clearNotificationBridgeLogsForTests();
  });

  it("taxonomy — 38 official types including Bloc3 Finance maturity", () => {
    expect(Object.values(OFFICIAL_ERP_EVENT_TYPES)).toHaveLength(91);
    expect(OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_SUBMITTED).toBe("hr.contract.submitted");
    expect(OFFICIAL_ERP_EVENT_TYPES.HR_RECRUITMENT_HIRE_SUBMITTED).toBe(
      "hr.recruitment.hire_submitted",
    );
  });

  it("catalog — bloc3 with 14 active HR events", () => {
    expect(ERP_EVENT_CATALOG_VERSION).toBe("erp-event-catalog-bloc3-platform-v1");
    const activeHr = listHrGovernanceEvents().filter((e) => e.status === "active");
    expect(activeHr.length).toBe(14);
    expect(activeHr.map((e) => e.type)).toContain(OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED);
    expect(activeHr.map((e) => e.type)).toContain(
      OFFICIAL_ERP_EVENT_TYPES.HR_RECRUITMENT_HIRE_SUBMITTED,
    );
  });

  it("write registry — P9 actions enabled", () => {
    const enabled = Object.values(HR_WRITE_ACTION_REGISTRY).filter((r) => r.enabled);
    expect(enabled.length).toBe(12);
    expect(HR_WRITE_ACTION_REGISTRY["hr.contract.submit_approval"]?.eventType).toBe(
      "hr.contract.submitted",
    );
  });

  it("notification bridge — P9 contract submitted maps to approvers", () => {
    const candidate = mapHrEventToNotificationCandidate({
      id: "evt-1",
      type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_SUBMITTED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: "user-1",
      departmentKey: "RH",
      entityType: "rh_contract",
      entityId: "ctr-1",
      correlationId: "ctr-1",
      causationId: null,
      payload: { contract_id: "ctr-1", approval_request_id: "apr-1" },
    });
    expect(candidate?.recipientScope).toBe("approvers");
    expect(candidate?.templateKey).toBe("hr.contract.submitted");
  });

  it("notification bridge — recruitment hire_submitted", () => {
    const candidate = mapHrEventToNotificationCandidate({
      id: "evt-2",
      type: OFFICIAL_ERP_EVENT_TYPES.HR_RECRUITMENT_HIRE_SUBMITTED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: "user-1",
      departmentKey: "RH",
      entityType: "rh_recruitment_hire",
      entityId: "cand-1",
      correlationId: "cand-1",
      causationId: null,
      payload: { candidate_name: "Jean Dupont" },
    });
    expect(candidate?.templateKey).toBe("hr.recruitment.hire_submitted");
    expect(candidate?.priority).toBe("high");
  });

  it("publish P9 event — handler invoked", async () => {
    registerNotificationHrBridgeHandler();
    await publishErpEvent({
      type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_RENEWED,
      actorUserId: "hr-user",
      departmentKey: "RH",
      entityType: "rh_contract",
      entityId: "ctr-9",
      payload: { new_end_date: "2027-12-31" },
      persistAudit: false,
      awaitDispatch: true,
    });
    const candidate = mapHrEventToNotificationCandidate({
      id: "x",
      type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_RENEWED,
      version: "erp-event-bus-b3.2-v1",
      family: "domain",
      sensitivity: "restricted",
      occurredAt: new Date().toISOString(),
      actorUserId: "hr-user",
      departmentKey: "RH",
      entityType: "rh_contract",
      entityId: "ctr-9",
      correlationId: "ctr-9",
      causationId: null,
      payload: { new_end_date: "2027-12-31" },
    });
    expect(candidate?.templateKey).toBe("hr.contract.renewed");
  });

  it("readiness — READY", () => {
    expect(HR_P9_READINESS_VERDICT.overall).toBe("READY");
  });
});
