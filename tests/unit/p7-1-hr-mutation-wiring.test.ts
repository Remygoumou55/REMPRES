import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { listHrGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { HR_MUTATION_INTEGRATION_TABLE } from "@/lib/erp-core/events/foundation/hr-mutation-integration-plan";
import { HR_WRITE_GOVERNANCE_SUMMARY } from "@/lib/hr/runtime/hr-write-registry";

const root = process.cwd();

function readSrc(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("P7.1 — HR mutation wiring", () => {
  it("registry — 5 writes enabled", () => {
    expect(HR_WRITE_GOVERNANCE_SUMMARY.enabledCount).toBeGreaterThanOrEqual(5);
    const reg = readSrc("lib/hr/runtime/hr-write-registry.ts");
    expect(reg).toMatch(/LEAVE_REQUEST[\s\S]*enabled:\s*true/);
    expect(reg).toMatch(/CONTRACT_CREATE[\s\S]*enabled:\s*true/);
    const gate = readSrc("lib/hr/runtime/hr-write-governance.ts");
    expect(gate).toContain("assertHrWriteActionAllowed");
  });

  it("hr-leave-mutations — gate, emit, audit", () => {
    const src = readSrc("modules/hr/server/services/hr-leave-mutations.ts");
    expect(src).toContain("assertHrWriteActionAllowed");
    expect(src).toContain("emitHrLeaveRequested");
    expect(src).toContain("emitHrLeaveApproved");
    expect(src).toContain("recordHrGovernanceAudit");
    expect(src).toContain("Promise.all");
  });

  it("rh actions — délègue hr-leave-mutations", () => {
    const actions = readSrc("app/(app)/rh/actions.ts");
    expect(actions).toContain("submitHrLeaveRequest");
    expect(actions).toContain("updateHrLeaveStatus");
    expect(actions).not.toContain('.from("rh_leave_requests")');
  });

  it("contract-actions — délègue createHrContract", () => {
    const actions = readSrc("modules/hr/contracts/server/actions/contract-actions.ts");
    expect(actions).toContain("createHrContract");
    expect(actions).not.toMatch(/from\("rh_employee_contracts"\)\s*\n\s*\.insert/);
  });

  it("catalogue — 4 hr events active", () => {
    const hr = listHrGovernanceEvents();
    const active = hr.filter((e) => e.status === "active");
    expect(active.map((e) => e.type)).toEqual(
      expect.arrayContaining([
        OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED,
        OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
        OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
        OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED,
      ]),
    );
    expect(active.length).toBeGreaterThanOrEqual(4);
  });

  it("integration table — 5 mutations done", () => {
    const done = HR_MUTATION_INTEGRATION_TABLE.filter((r) => r.integrationPhase === "done");
    expect(done).toHaveLength(5);
  });
});
