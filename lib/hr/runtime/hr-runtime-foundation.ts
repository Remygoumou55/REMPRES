/**
 * P7 — HR_RUNTIME_FOUNDATION (design read-first, governed-write-ready).
 */

import { HR_DEPARTMENT_KEY } from "@/lib/hr/governance/hr-domain-governance";

export const HR_RUNTIME_FOUNDATION_VERSION = "hr-runtime-foundation-p7-v1" as const;

export const HR_RUNTIME_FOUNDATION = {
  version: HR_RUNTIME_FOUNDATION_VERSION,
  departmentKey: HR_DEPARTMENT_KEY,
  mode: "read_first" as const,
  writeGovernance: "lib/hr/runtime/hr-write-governance.ts",
  security: "lib/hr/runtime/hr-runtime-security.ts",
  sourcesOfTruth: {
    employees: "public.profiles (department_key RH)",
    contracts: "public.rh_employee_contracts",
    leaves: "public.rh_leave_requests",
    attendance: "public.rh_attendance_events",
    approvals: "public.approval_requests (department_key rh)",
  },
  readSurfaces: [
    "modules/hr/employees/server/services/employee-service.ts",
    "modules/hr/contracts/server/services/contract-service.ts",
    "lib/server/rh-foundation.ts",
    "app/(app)/rh/page.tsx",
  ],
  writeSurfacesDeferred: [
    "modules/hr/contracts/server/actions/contract-actions.ts",
    "app/(app)/rh/actions.ts",
  ],
  payrollExcluded: true,
  eventPublishPath: "lib/erp-core/events/integrations/hr-events.ts",
} as const;
