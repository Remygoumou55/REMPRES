/**
 * P7 — HR_RUNTIME_DESIGN_MAP (runtime, security, SoT, payload, ownership).
 */

export const HR_RUNTIME_DESIGN_MAP_VERSION = "hr-runtime-design-p7-v1" as const;

export type HrRuntimeDesignEntry = {
  surface: string;
  operation: "read" | "write_governed" | "approval_sync";
  sourceOfTruth: string;
  payloadScope: string;
  owner: string;
  security: string;
  eventOnSuccess: string | null;
};

export const HR_RUNTIME_DESIGN_MAP: readonly HrRuntimeDesignEntry[] = [
  {
    surface: "employee_registry",
    operation: "read",
    sourceOfTruth: "profiles + rh_employee_* extensions",
    payloadScope: "employeeId, role, manager, documents meta",
    owner: "modules/hr/employees",
    security: "assertCanReadEmployeeDomain",
    eventOnSuccess: null,
  },
  {
    surface: "employee_registry",
    operation: "write_governed",
    sourceOfTruth: "profiles",
    payloadScope: "role_assignment, manager_id",
    owner: "modules/hr/employees",
    security: "assertHrRuntimeWriteAccess + gate (P7.1)",
    eventOnSuccess: "hr.employee.updated",
  },
  {
    surface: "contract_visibility",
    operation: "read",
    sourceOfTruth: "rh_employee_contracts",
    payloadScope: "contract status, dates, employee_id",
    owner: "modules/hr/contracts",
    security: "assertCanReadContracts",
    eventOnSuccess: null,
  },
  {
    surface: "contract_visibility",
    operation: "write_governed",
    sourceOfTruth: "rh_employee_contracts",
    payloadScope: "draft create, submit approval",
    owner: "modules/hr/contracts",
    security: "assertHrRuntimeWriteAccess + gate (P7.1)",
    eventOnSuccess: "hr.contract.created",
  },
  {
    surface: "contract_visibility",
    operation: "approval_sync",
    sourceOfTruth: "approval_requests + SQL trigger 044",
    payloadScope: "rh_contract_activation",
    owner: "supabase/sql/044_rh_contract_approval_sync.sql",
    security: "super_admin decideApprovalRequest",
    eventOnSuccess: null,
  },
  {
    surface: "leave_visibility",
    operation: "read",
    sourceOfTruth: "rh_leave_requests",
    payloadScope: "leave type, dates, status",
    owner: "app/(app)/rh/conges",
    security: "getModulePermissions rh read",
    eventOnSuccess: null,
  },
  {
    surface: "leave_visibility",
    operation: "write_governed",
    sourceOfTruth: "rh_leave_requests",
    payloadScope: "submit + status transition",
    owner: "app/(app)/rh/actions.ts",
    security: "assertHrRuntimeWriteAccess + gate (P7.1)",
    eventOnSuccess: "hr.leave.requested | hr.leave.approved",
  },
  {
    surface: "contract_expiry_signal",
    operation: "read",
    sourceOfTruth: "rh_employee_contracts.end_date",
    payloadScope: "contracts nearing end_date",
    owner: "lib/hr/runtime (scheduled evaluator P7.3)",
    security: "assertHrRuntimeReadAccess",
    eventOnSuccess: "hr.contract.expiring",
  },
] as const;
