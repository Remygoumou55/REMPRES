import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  HR_DOMAIN_COMPLETION_MATRIX,
  HR_DOMAIN_COMPLETION_VERSION,
  HR_LEAVE_TYPES_OFFICIAL,
} from "@/lib/hr/runtime/hr-domain-completion-registry";
import { HR_LEAVE_TYPES } from "@/lib/hr/constants/hr-leave-types";
import { HR_GOVERNANCE_MAP } from "@/lib/hr/governance/hr-domain-governance";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { HR_WRITE_ACTIONS } from "@/lib/hr/runtime/hr-write-registry";
import { HR_VISUAL_REPOSITORY_PLACEHOLDER } from "@/modules/department-dashboards/hr/server/repositories/hr-visual-placeholder";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("HR domain completion matrix — Bloc 3 Étape 1", () => {
  it("registry version", () => {
    expect(HR_DOMAIN_COMPLETION_VERSION).toBe("hr-domain-completion-bloc3-v1");
    expect(HR_DOMAIN_COMPLETION_MATRIX.length).toBeGreaterThanOrEqual(5);
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "Employee lifecycle",
      expected: "status mutation + history",
      check: () => readSrc("modules/hr/server/services/hr-employee-mutations.ts").includes("updateHrEmployeeEmploymentStatus"),
    },
    {
      area: "Attendance",
      expected: "hr-attendance-mutations + bus",
      check: () => {
        const src = readSrc("modules/hr/server/services/hr-attendance-mutations.ts");
        return src.includes("emitHrAttendanceRecorded") && src.includes("ATTENDANCE_RECORD");
      },
    },
    {
      area: "Leave types",
      expected: "annual sick special unpaid",
      check: () => HR_LEAVE_TYPES.join(",") === HR_LEAVE_TYPES_OFFICIAL.join(","),
    },
    {
      area: "Leave rejected event",
      expected: "hr.leave.rejected",
      check: () => readSrc("modules/hr/server/services/hr-leave-mutations.ts").includes("emitHrLeaveRejected"),
    },
    {
      area: "Leave approval SQL sync",
      expected: "047 migration",
      check: () => readSrc("supabase/sql/047_rh_domain_completion.sql").includes("sync_rh_leave_from_approval_request"),
    },
    {
      area: "RH actions delegate",
      expected: "no direct attendance insert",
      check: () => {
        const actions = readSrc("app/(app)/rh/actions.ts");
        return actions.includes("recordHrAttendance") && !actions.includes('.from("rh_attendance_events")');
      },
    },
    {
      area: "Governance attendance",
      expected: "active",
      check: () => HR_GOVERNANCE_MAP.find((c) => c.id === "attendance_visibility")?.status === "active",
    },
    {
      area: "Governance leave",
      expected: "active",
      check: () => HR_GOVERNANCE_MAP.find((c) => c.id === "leave_visibility")?.status === "active",
    },
    {
      area: "Event bus",
      expected: "attendance + status + rejected",
      check: () =>
        OFFICIAL_ERP_EVENT_TYPES.HR_ATTENDANCE_RECORDED === "hr.attendance.recorded" &&
        OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_STATUS_CHANGED === "hr.employee.status_changed" &&
        OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REJECTED === "hr.leave.rejected",
    },
    {
      area: "Dept KPI",
      expected: "non-placeholder",
      check: () => !readSrc("modules/analytics/aggregation/rh-dept-kpi-live.ts").includes("placeholder: true"),
    },
    {
      area: "Visual repository",
      expected: "live",
      check: () => HR_VISUAL_REPOSITORY_PLACEHOLDER === false,
    },
    {
      area: "Super Admin lock",
      expected: "ErpNavSidebar unchanged",
      check: () => {
        const sa = readSrc("components/layout/app-shell/ErpNavSidebar.tsx");
        return sa.includes("export const ErpNavSidebar") && !existsSync(join(ROOT, "modules/hr/super-admin-touch.ts"));
      },
    },
    {
      area: "Write registry",
      expected: "attendance + status",
      check: () =>
        HR_WRITE_ACTIONS.ATTENDANCE_RECORD === "hr.attendance.record" &&
        HR_WRITE_ACTIONS.EMPLOYEE_STATUS_UPDATE === "hr.employee.status_update",
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
