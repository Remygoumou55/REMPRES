import { describe, expect, it } from "vitest";
import {
  ERP_EVENT_CATALOG_VERSION,
  ERP_EVENT_GOVERNANCE_MAP,
  listHrGovernanceEvents,
} from "@/lib/erp-core/events/governance/event-catalog-governance";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { HR_EVENT_GOVERNANCE_AMENDMENT } from "@/lib/erp-core/events/governance/hr-event-governance-amendment";
import { HR_PUBLISHER_DESIGN_MAP } from "@/lib/erp-core/events/governance/hr-publisher-design-map";
import { HR_NOTIFICATION_READINESS_MAP } from "@/lib/erp-core/events/governance/hr-notification-readiness-map";
import { HR_AUTOMATION_READINESS_MAP } from "@/lib/erp-core/events/governance/hr-automation-readiness-map";
import {
  HR_FOUNDATION_READINESS_CHECKS,
  HR_FOUNDATION_READINESS_VERDICT,
} from "@/lib/erp-core/events/foundation/hr-event-readiness-validation";
import { HR_NOTIFICATION_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/hr-notification-readiness-validation";
import { HR_AUTOMATION_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/hr-automation-readiness-validation";
import { HR_DOMAIN_GOVERNANCE, HR_GOVERNANCE_MAP } from "@/lib/hr/governance/hr-domain-governance";
import { HR_WRITE_GOVERNANCE_SUMMARY } from "@/lib/hr/runtime/hr-write-registry";

describe("P7 — HR Event Foundation", () => {
  it("extends official taxonomy with hr.* types (38 total post-Bloc3 Finance)", () => {
    expect(OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED).toBe("hr.employee.created");
    expect(OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING).toBe("hr.contract.expiring");
    expect(OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED).toBe("hr.leave.approved");
    expect(OFFICIAL_ERP_EVENT_TYPES.HR_ATTENDANCE_RECORDED).toBe("hr.attendance.recorded");
    expect(Object.values(OFFICIAL_ERP_EVENT_TYPES)).toHaveLength(38);
  });

  it("catalog has 38 governance entries, HR types in catalog", () => {
    expect(ERP_EVENT_CATALOG_VERSION).toBe("erp-event-catalog-bloc3-finance-v1");
    expect(ERP_EVENT_GOVERNANCE_MAP).toHaveLength(38);
    const hrEvents = listHrGovernanceEvents();
    expect(hrEvents.length).toBeGreaterThanOrEqual(11);
    expect(hrEvents.filter((e) => e.status === "active").length).toBeGreaterThanOrEqual(11);
    expect(hrEvents.every((e) => e.owner === "hr")).toBe(true);
  });

  it("HR event governance amendment — 6 types restricted", () => {
    expect(HR_EVENT_GOVERNANCE_AMENDMENT).toHaveLength(6);
    expect(new Set(HR_EVENT_GOVERNANCE_AMENDMENT.map((e) => e.type)).size).toBe(6);
    expect(HR_EVENT_GOVERNANCE_AMENDMENT.every((e) => e.sensitivity === "restricted")).toBe(true);
  });

  it("publisher design map — 6 publishers publisher_ready", () => {
    expect(HR_PUBLISHER_DESIGN_MAP).toHaveLength(6);
    expect(HR_PUBLISHER_DESIGN_MAP.filter((p) => p.wirePhase === "active")).toHaveLength(5);
  });

  it("notification readiness — minimum contract expiring + leave", () => {
    const candidates = HR_NOTIFICATION_READINESS_MAP.filter((r) => r.candidate);
    expect(candidates.length).toBeGreaterThanOrEqual(3);
    expect(candidates.map((c) => c.eventType)).toContain("hr.contract.expiring");
    expect(candidates.map((c) => c.eventType)).toContain("hr.leave.requested");
  });

  it("automation readiness — contract expiring + leave approved", () => {
    const candidates = HR_AUTOMATION_READINESS_MAP.filter((r) => r.candidate);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates.every((c) => c.writeAutoForbidden)).toBe(true);
  });

  it("domain governance — payroll blocked, bus planned", () => {
    expect(HR_DOMAIN_GOVERNANCE.departmentKey).toBe("RH");
    expect(HR_DOMAIN_GOVERNANCE.payrollInScope).toBe(false);
    const payroll = HR_GOVERNANCE_MAP.find((c) => c.id === "payroll_engine");
    expect(payroll?.status).toBe("blocked");
    const bus = HR_GOVERNANCE_MAP.find((c) => c.id === "hr_event_bus");
    expect(bus?.status).toBe("active");
    const bridge = HR_GOVERNANCE_MAP.find((c) => c.id === "hr_notification_bridge");
    expect(bridge?.status).toBe("active");
  });

  it("writes enabled — P7.1 scope", () => {
    expect(HR_WRITE_GOVERNANCE_SUMMARY.enabledCount).toBeGreaterThanOrEqual(10);
  });

  it("foundation readiness verdict READY", () => {
    expect(HR_FOUNDATION_READINESS_CHECKS.every((c) => c.passed)).toBe(true);
    expect(HR_FOUNDATION_READINESS_VERDICT.overallP7).toBe("READY");
    expect(HR_FOUNDATION_READINESS_VERDICT.mutationWiring).toBe("READY");
    expect(HR_FOUNDATION_READINESS_VERDICT.notificationBridge).toBe("READY");
    expect(HR_NOTIFICATION_READINESS_VERDICT.p72BridgeReady).toBe(true);
    expect(HR_FOUNDATION_READINESS_VERDICT.automationRules).toBe("READY");
    expect(HR_AUTOMATION_READINESS_VERDICT.p73AutomationReady).toBe(true);
  });
});
