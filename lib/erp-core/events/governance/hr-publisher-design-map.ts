/**
 * P7 — HR_PUBLISHER_DESIGN_MAP (publisher → bus → trace).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const HR_PUBLISHER_DESIGN_MAP_VERSION = "hr-publisher-design-p7-v1" as const;

export type HrPublisherDesignEntry = {
  publisher: string;
  eventType: string;
  entityType: string;
  family: "domain";
  sensitivity: "restricted";
  owner: "hr";
  payloadKeys: readonly string[];
  correlationId: string;
  causationId: string | null;
  wirePhase: "publisher_ready" | "active";
  mutationAction: string | null;
  traceability: "integration_publish_defaults";
  security: string;
};

export const HR_PUBLISHER_DESIGN_MAP: readonly HrPublisherDesignEntry[] = [
  {
    publisher: "emitHrEmployeeCreated",
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED,
    entityType: "profiles",
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    payloadKeys: ["employee_id", "department_key", "role", "status"],
    correlationId: "employeeId",
    causationId: null,
    wirePhase: "publisher_ready",
    mutationAction: null,
    traceability: "integration_publish_defaults",
    security: "assertHrRuntimeWriteAccess + gate (P7.1)",
  },
  {
    publisher: "emitHrEmployeeUpdated",
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED,
    entityType: "profiles",
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    payloadKeys: ["employee_id", "field", "from_value", "to_value"],
    correlationId: "employeeId",
    causationId: null,
    wirePhase: "active",
    mutationAction: "hr.employee.role_update",
    traceability: "integration_publish_defaults",
    security: "assertHrRuntimeWriteAccess + gate (P7.1)",
  },
  {
    publisher: "emitHrContractCreated",
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED,
    entityType: "rh_contract",
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    payloadKeys: ["contract_id", "employee_id", "contract_type", "status", "start_date", "end_date"],
    correlationId: "contractId",
    causationId: null,
    wirePhase: "active",
    mutationAction: "hr.contract.create",
    traceability: "integration_publish_defaults",
    security: "assertHrRuntimeWriteAccess + gate (P7.1)",
  },
  {
    publisher: "emitHrContractExpiring",
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    entityType: "rh_contract",
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    payloadKeys: ["contract_id", "employee_id", "end_date", "days_until_expiry"],
    correlationId: "contractId",
    causationId: null,
    wirePhase: "active",
    mutationAction: null,
    traceability: "integration_publish_defaults",
    security: "assertHrRuntimeReadAccess (evaluator P7.3)",
  },
  {
    publisher: "emitHrLeaveRequested",
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
    entityType: "leave_request",
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    payloadKeys: ["leave_id", "employee_id", "leave_type", "start_date", "end_date", "status"],
    correlationId: "leaveId",
    causationId: null,
    wirePhase: "active",
    mutationAction: "hr.leave.request",
    traceability: "integration_publish_defaults",
    security: "assertHrRuntimeWriteAccess + gate (P7.1)",
  },
  {
    publisher: "emitHrLeaveApproved",
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    entityType: "leave_request",
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    payloadKeys: ["leave_id", "employee_id", "from_status", "to_status", "approver_id"],
    correlationId: "leaveId",
    causationId: "approvalRequestId",
    wirePhase: "active",
    mutationAction: "hr.leave.status_update",
    traceability: "integration_publish_defaults",
    security: "assertHrRuntimeWriteAccess + gate (P7.1)",
  },
] as const;
