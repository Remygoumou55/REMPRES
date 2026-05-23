/**
 * B3.2 — Taxonomie et naming lock (`domain.entity.action`).
 */

import type { ErpEventFamily, ErpEventSensitivity } from "@/lib/erp-core/events/event-contracts";

export const ERP_EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]+$/;

/** Catalogue officiel — extensions via amendement B3.2.x uniquement. */
export const OFFICIAL_ERP_EVENT_TYPES = {
  APPROVAL_REQUEST_CREATED: "approval.request.created",
  APPROVAL_REQUEST_APPROVED: "approval.request.approved",
  APPROVAL_REQUEST_REJECTED: "approval.request.rejected",
  APPROVAL_GATE_GRANTED: "approval.gate.granted",
  MUTATION_BLOCKED_PENDING: "mutation.blocked.pending",
  CRM_QUOTE_CONVERTED: "crm.quote.converted",
  CRM_QUOTE_CONVERT_REQUESTED: "crm.quote.convert_requested",
  CRM_LEAD_CREATED: "crm.lead.created",
  CRM_QUOTE_CREATED: "crm.quote.created",
  CRM_QUOTE_STATUS_UPDATED: "crm.quote.status_updated",
  FINANCE_TRANSACTION_RECORDED: "finance.transaction.recorded",
  FINANCE_TRANSACTION_FAILED: "finance.transaction.failed",
  FINANCE_THRESHOLD_EXCEEDED: "finance.threshold.exceeded",
  FINANCE_PAYMENT_RECORDED: "finance.payment.recorded",
  FINANCE_EXPENSE_CREATED: "finance.expense.created",
  FINANCE_EXPENSE_UPDATED: "finance.expense.updated",
  HR_EMPLOYEE_CREATED: "hr.employee.created",
  HR_EMPLOYEE_UPDATED: "hr.employee.updated",
  HR_CONTRACT_CREATED: "hr.contract.created",
  HR_CONTRACT_SUBMITTED: "hr.contract.submitted",
  HR_CONTRACT_EXPIRING: "hr.contract.expiring",
  HR_CONTRACT_EXPIRED: "hr.contract.expired",
  HR_CONTRACT_TERMINATED: "hr.contract.terminated",
  HR_CONTRACT_RENEWED: "hr.contract.renewed",
  HR_RECRUITMENT_HIRE_SUBMITTED: "hr.recruitment.hire_submitted",
  HR_LEAVE_REQUESTED: "hr.leave.requested",
  HR_LEAVE_APPROVED: "hr.leave.approved",
  SYSTEM_AUDIT_RECORDED: "system.audit.recorded",
  RUNTIME_ORCHESTRATION_COMPLETED: "runtime.orchestration.completed",
  RUNTIME_ORCHESTRATION_FAILED: "runtime.orchestration.failed",
} as const;

export type OfficialErpEventType =
  (typeof OFFICIAL_ERP_EVENT_TYPES)[keyof typeof OFFICIAL_ERP_EVENT_TYPES];

const EVENT_META: Record<
  OfficialErpEventType,
  { family: ErpEventFamily; sensitivity: ErpEventSensitivity; owner: string }
> = {
  [OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_CREATED]: {
    family: "approval",
    sensitivity: "internal",
    owner: "approval-engine",
  },
  [OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED]: {
    family: "approval",
    sensitivity: "internal",
    owner: "approval-engine",
  },
  [OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_REJECTED]: {
    family: "approval",
    sensitivity: "internal",
    owner: "approval-engine",
  },
  [OFFICIAL_ERP_EVENT_TYPES.APPROVAL_GATE_GRANTED]: {
    family: "approval",
    sensitivity: "internal",
    owner: "approval-engine",
  },
  [OFFICIAL_ERP_EVENT_TYPES.MUTATION_BLOCKED_PENDING]: {
    family: "mutation",
    sensitivity: "internal",
    owner: "mutation-gate",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERT_REQUESTED]: {
    family: "mutation",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CREATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_STATUS_UPDATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_SUBMITTED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_TERMINATED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_RENEWED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_RECRUITMENT_HIRE_SUBMITTED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SYSTEM_AUDIT_RECORDED]: {
    family: "audit",
    sensitivity: "restricted",
    owner: "governance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_COMPLETED]: {
    family: "runtime",
    sensitivity: "internal",
    owner: "runtime",
  },
  [OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_FAILED]: {
    family: "runtime",
    sensitivity: "internal",
    owner: "runtime",
  },
};

export function assertValidEventType(type: string): void {
  if (!ERP_EVENT_TYPE_PATTERN.test(type)) {
    throw new Error(`erp_event:invalid_type_format:${type}`);
  }
}

export function resolveOfficialEventMeta(type: OfficialErpEventType) {
  return EVENT_META[type];
}

export function isOfficialEventType(type: string): type is OfficialErpEventType {
  return Object.values(OFFICIAL_ERP_EVENT_TYPES).includes(type as OfficialErpEventType);
}
