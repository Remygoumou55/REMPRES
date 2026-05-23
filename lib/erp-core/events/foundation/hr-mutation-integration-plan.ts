/**
 * P7 / P7.1 — Plan intégration mutations RH → bus.
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { HR_WRITE_ACTIONS } from "@/lib/hr/runtime/hr-write-registry";

export const HR_MUTATION_INTEGRATION_PLAN_VERSION = "hr-mutation-integration-p7-1-v1" as const;

export type HrMutationIntegrationRow = {
  mutationAction: string;
  eventTypes: string;
  publisher: string;
  integrationPhase: "done" | "p7_1" | "p7_2" | "later";
  legacyPath: string;
  futureHandler: string;
};

export const HR_MUTATION_INTEGRATION_TABLE: readonly HrMutationIntegrationRow[] = [
  {
    mutationAction: HR_WRITE_ACTIONS.CONTRACT_CREATE,
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED,
    publisher: "emitHrContractCreated",
    integrationPhase: "done",
    legacyPath: "contract-actions.ts → hr-contract-mutations.ts",
    futureHandler: "notification-hr-bridge (P7.2)",
  },
  {
    mutationAction: HR_WRITE_ACTIONS.LEAVE_REQUEST,
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
    publisher: "emitHrLeaveRequested",
    integrationPhase: "done",
    legacyPath: "rh/actions.ts → hr-leave-mutations.ts",
    futureHandler: "notification-hr-bridge (P7.2)",
  },
  {
    mutationAction: HR_WRITE_ACTIONS.LEAVE_STATUS_UPDATE,
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    publisher: "emitHrLeaveApproved",
    integrationPhase: "done",
    legacyPath: "rh/actions.ts → hr-leave-mutations.ts",
    futureHandler: "automation post-approval (P7.3)",
  },
  {
    mutationAction: HR_WRITE_ACTIONS.EMPLOYEE_ROLE_UPDATE,
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED,
    publisher: "emitHrEmployeeUpdated",
    integrationPhase: "done",
    legacyPath: "employee-actions.ts → hr-employee-mutations.ts",
    futureHandler: "notification-hr-bridge (P9+)",
  },
  {
    mutationAction: HR_WRITE_ACTIONS.EMPLOYEE_MANAGER_UPDATE,
    eventTypes: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED,
    publisher: "emitHrEmployeeUpdated",
    integrationPhase: "done",
    legacyPath: "employee-actions.ts → hr-employee-mutations.ts",
    futureHandler: "notification-hr-bridge (P9+)",
  },
  {
    mutationAction: HR_WRITE_ACTIONS.CONTRACT_SUBMIT_APPROVAL,
    eventTypes: "approval.request.created (existant)",
    publisher: "n/a",
    integrationPhase: "later",
    legacyPath: "contract-actions.ts submitContractForApprovalAction",
    futureHandler: "approval-events",
  },
] as const;
