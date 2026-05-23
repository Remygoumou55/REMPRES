/**
 * P7 — Publishers officiels HR (foundation — publishers prêts, wiring P7.1).
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { HR_DEPARTMENT_KEY } from "@/lib/hr/governance/hr-domain-governance";

export async function emitHrEmployeeCreated(params: {
  actorUserId: string;
  employeeId: string;
  role?: string | null;
  status?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "profiles",
    entityId: params.employeeId,
    correlationId: params.employeeId,
    payload: {
      employee_id: params.employeeId,
      department_key: HR_DEPARTMENT_KEY,
      role: params.role ?? null,
      status: params.status ?? "active",
    },
  });
}

export async function emitHrEmployeeUpdated(params: {
  actorUserId: string;
  employeeId: string;
  field: string;
  fromValue?: string | null;
  toValue?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "profiles",
    entityId: params.employeeId,
    correlationId: params.employeeId,
    payload: {
      employee_id: params.employeeId,
      field: params.field,
      from_value: params.fromValue ?? null,
      to_value: params.toValue ?? null,
    },
  });
}

export async function emitHrContractCreated(params: {
  actorUserId: string;
  contractId: string;
  employeeId: string;
  contractType: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "rh_contract",
    entityId: params.contractId,
    correlationId: params.contractId,
    payload: {
      contract_id: params.contractId,
      employee_id: params.employeeId,
      contract_type: params.contractType,
      status: params.status,
      start_date: params.startDate ?? null,
      end_date: params.endDate ?? null,
    },
  });
}

export async function emitHrContractSubmitted(params: {
  actorUserId: string;
  contractId: string;
  employeeId: string;
  approvalRequestId: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_SUBMITTED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "rh_contract",
    entityId: params.contractId,
    correlationId: params.contractId,
    causationId: params.approvalRequestId,
    payload: {
      contract_id: params.contractId,
      employee_id: params.employeeId,
      approval_request_id: params.approvalRequestId,
    },
  });
}

export async function emitHrContractExpired(params: {
  actorUserId: string;
  contractId: string;
  employeeId: string;
  previousStatus: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "rh_contract",
    entityId: params.contractId,
    correlationId: params.contractId,
    payload: {
      contract_id: params.contractId,
      employee_id: params.employeeId,
      previous_status: params.previousStatus,
    },
  });
}

export async function emitHrContractTerminated(params: {
  actorUserId: string;
  contractId: string;
  employeeId: string;
  previousStatus: string;
  reason?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_TERMINATED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "rh_contract",
    entityId: params.contractId,
    correlationId: params.contractId,
    payload: {
      contract_id: params.contractId,
      employee_id: params.employeeId,
      previous_status: params.previousStatus,
      reason: params.reason ?? null,
    },
  });
}

export async function emitHrContractRenewed(params: {
  actorUserId: string;
  contractId: string;
  employeeId: string;
  previousEndDate: string | null;
  newEndDate: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_RENEWED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "rh_contract",
    entityId: params.contractId,
    correlationId: params.contractId,
    payload: {
      contract_id: params.contractId,
      employee_id: params.employeeId,
      previous_end_date: params.previousEndDate,
      new_end_date: params.newEndDate,
    },
  });
}

export async function emitHrRecruitmentHireSubmitted(params: {
  actorUserId: string;
  candidateId: string;
  approvalRequestId: string;
  candidateName?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_RECRUITMENT_HIRE_SUBMITTED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "rh_recruitment_hire",
    entityId: params.candidateId,
    correlationId: params.candidateId,
    causationId: params.approvalRequestId,
    payload: {
      candidate_id: params.candidateId,
      approval_request_id: params.approvalRequestId,
      candidate_name: params.candidateName ?? null,
    },
  });
}

export async function emitHrContractExpiring(params: {
  actorUserId?: string | null;
  contractId: string;
  employeeId: string;
  endDate: string;
  daysUntilExpiry: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING, {
    actorUserId: params.actorUserId ?? null,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "rh_contract",
    entityId: params.contractId,
    correlationId: params.contractId,
    payload: {
      contract_id: params.contractId,
      employee_id: params.employeeId,
      end_date: params.endDate,
      days_until_expiry: params.daysUntilExpiry,
    },
  });
}

export async function emitHrLeaveRequested(params: {
  actorUserId: string;
  leaveId: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status?: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "leave_request",
    entityId: params.leaveId,
    correlationId: params.leaveId,
    payload: {
      leave_id: params.leaveId,
      employee_id: params.employeeId,
      leave_type: params.leaveType,
      start_date: params.startDate,
      end_date: params.endDate,
      status: params.status ?? "pending",
    },
  });
}

export async function emitHrLeaveApproved(params: {
  actorUserId: string;
  leaveId: string;
  employeeId: string;
  fromStatus: string;
  toStatus: string;
  approverId?: string | null;
  approvalRequestId?: string | null;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED, {
    actorUserId: params.actorUserId,
    departmentKey: HR_DEPARTMENT_KEY,
    entityType: "leave_request",
    entityId: params.leaveId,
    correlationId: params.leaveId,
    causationId: params.approvalRequestId ?? undefined,
    payload: {
      leave_id: params.leaveId,
      employee_id: params.employeeId,
      from_status: params.fromStatus,
      to_status: params.toStatus,
      approver_id: params.approverId ?? null,
    },
  });
}
