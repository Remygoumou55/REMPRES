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
  CRM_LEAD_UPDATED: "crm.lead.updated",
  CRM_LEAD_CONVERTED: "crm.lead.converted",
  CRM_PIPELINE_UPDATED: "crm.pipeline.updated",
  CRM_DEAL_CREATED: "crm.deal.created",
  CRM_DEAL_WON: "crm.deal.won",
  CRM_DEAL_LOST: "crm.deal.lost",
  CRM_ACTIVITY_CREATED: "crm.activity.created",
  CRM_ACTIVITY_COMPLETED: "crm.activity.completed",
  CRM_REPORT_GENERATED: "crm.report.generated",
  CRM_QUOTE_CREATED: "crm.quote.created",
  CRM_QUOTE_STATUS_UPDATED: "crm.quote.status_updated",
  FINANCE_TRANSACTION_RECORDED: "finance.transaction.recorded",
  FINANCE_TRANSACTION_FAILED: "finance.transaction.failed",
  FINANCE_THRESHOLD_EXCEEDED: "finance.threshold.exceeded",
  FINANCE_PAYMENT_RECORDED: "finance.payment.recorded",
  FINANCE_EXPENSE_CREATED: "finance.expense.created",
  FINANCE_EXPENSE_UPDATED: "finance.expense.updated",
  FINANCE_TRANSACTION_UPDATED: "finance.transaction.updated",
  FINANCE_APPROVAL_REQUESTED: "finance.approval.requested",
  FINANCE_APPROVAL_APPROVED: "finance.approval.approved",
  FINANCE_APPROVAL_REJECTED: "finance.approval.rejected",
  FINANCE_REPORT_GENERATED: "finance.report.generated",
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
  HR_LEAVE_REJECTED: "hr.leave.rejected",
  HR_ATTENDANCE_RECORDED: "hr.attendance.recorded",
  HR_EMPLOYEE_STATUS_CHANGED: "hr.employee.status_changed",
  SUPPLY_SUPPLIER_CREATED: "supply.supplier.created",
  SUPPLY_PURCHASE_REQUESTED: "supply.purchase.requested",
  SUPPLY_PURCHASE_APPROVED: "supply.purchase.approved",
  SUPPLY_PO_CREATED: "supply.po.created",
  SUPPLY_INVENTORY_RECEIVED: "supply.inventory.received",
  SUPPLY_STOCK_ADJUSTED: "supply.stock.adjusted",
  SUPPLY_INVENTORY_MOVED: "supply.inventory.moved",
  SUPPLY_REPORT_GENERATED: "supply.report.generated",
  OPS_TASK_CREATED: "ops.task.created",
  OPS_TASK_ASSIGNED: "ops.task.assigned",
  OPS_TASK_COMPLETED: "ops.task.completed",
  OPS_WORKFLOW_STARTED: "ops.workflow.started",
  OPS_WORKFLOW_APPROVED: "ops.workflow.approved",
  OPS_PROJECT_CREATED: "ops.project.created",
  OPS_DELIVERY_COMPLETED: "ops.delivery.completed",
  OPS_EXECUTION_DELAYED: "ops.execution.delayed",
  OPS_REPORT_GENERATED: "ops.report.generated",
  EXECUTIVE_SNAPSHOT_REFRESHED: "executive.snapshot.refreshed",
  EXECUTIVE_KPI_THRESHOLD_EXCEEDED: "executive.kpi.threshold_exceeded",
  EXECUTIVE_FORECAST_GENERATED: "executive.forecast.generated",
  EXECUTIVE_SIGNAL_RAISED: "executive.signal.raised",
  ANALYTICS_SNAPSHOT_COMPUTED: "analytics.snapshot.computed",
  ANALYTICS_REPORT_GENERATED: "analytics.report.generated",
  OBSERVABILITY_HUB_REFRESHED: "observability.hub.refreshed",
  OBSERVABILITY_HEALTH_DEGRADED: "observability.health.degraded",
  OBSERVABILITY_INCIDENT_ESCALATED: "observability.incident.escalated",
  SYSTEM_AUDIT_RECORDED: "system.audit.recorded",
  RUNTIME_ORCHESTRATION_COMPLETED: "runtime.orchestration.completed",
  RUNTIME_ORCHESTRATION_FAILED: "runtime.orchestration.failed",
  AUTOMATION_RULE_TRIGGERED: "automation.rule.triggered",
  AUTOMATION_RULE_EXECUTED: "automation.rule.executed",
  AUTOMATION_RULE_FAILED: "automation.rule.failed",
  AUTOMATION_WORKFLOW_STARTED: "automation.workflow.started",
  AUTOMATION_WORKFLOW_COMPLETED: "automation.workflow.completed",
  AUTOMATION_CROSS_DOMAIN_ORCHESTRATED: "automation.cross_domain.orchestrated",
  AUTOMATION_AI_RECOMMENDATION_GENERATED: "automation.ai.recommendation.generated",
  AUTOMATION_AI_DECISION_SUPPORT_EMITTED: "automation.ai.decision_support.emitted",
  AUTOMATION_REPORT_GENERATED: "automation.report.generated",
  PLATFORM_API_REGISTERED: "platform.api.registered",
  PLATFORM_API_INVOKED: "platform.api.invoked",
  PLATFORM_INTEGRATION_CONNECTED: "platform.integration.connected",
  PLATFORM_CONNECTOR_HEALTH_DEGRADED: "platform.connector.health_degraded",
  PLATFORM_CONNECTOR_SYNC_COMPLETED: "platform.connector.sync_completed",
  PLATFORM_PLUGIN_INSTALLED: "platform.plugin.installed",
  PLATFORM_MARKETPLACE_LISTING_PUBLISHED: "platform.marketplace.listing_published",
  PLATFORM_DEVELOPER_SANDBOX_READY: "platform.developer.sandbox_ready",
  PLATFORM_REPORT_GENERATED: "platform.report.generated",
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
  [OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_UPDATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CONVERTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_PIPELINE_UPDATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_CREATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_WON]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_LOST]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_ACTIVITY_CREATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_ACTIVITY_COMPLETED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "vente-crm",
  },
  [OFFICIAL_ERP_EVENT_TYPES.CRM_REPORT_GENERATED]: {
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
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_UPDATED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_APPROVAL_REQUESTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_APPROVAL_APPROVED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_APPROVAL_REJECTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "finance",
  },
  [OFFICIAL_ERP_EVENT_TYPES.FINANCE_REPORT_GENERATED]: {
    family: "domain",
    sensitivity: "internal",
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
  [OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REJECTED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_ATTENDANCE_RECORDED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_STATUS_CHANGED]: {
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_SUPPLIER_CREATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "logistics",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PURCHASE_REQUESTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "logistics",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PURCHASE_APPROVED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "logistics",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PO_CREATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "logistics",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_INVENTORY_RECEIVED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "logistics",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_STOCK_ADJUSTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "logistics",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_INVENTORY_MOVED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "logistics",
  },
  [OFFICIAL_ERP_EVENT_TYPES.SUPPLY_REPORT_GENERATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "logistics",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_CREATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_ASSIGNED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_COMPLETED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_WORKFLOW_STARTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_WORKFLOW_APPROVED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_PROJECT_CREATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_DELIVERY_COMPLETED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_EXECUTION_DELAYED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OPS_REPORT_GENERATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "operations",
  },
  [OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_SNAPSHOT_REFRESHED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "executive",
  },
  [OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_KPI_THRESHOLD_EXCEEDED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "executive",
  },
  [OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_FORECAST_GENERATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "executive",
  },
  [OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_SIGNAL_RAISED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "executive",
  },
  [OFFICIAL_ERP_EVENT_TYPES.ANALYTICS_SNAPSHOT_COMPUTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "executive",
  },
  [OFFICIAL_ERP_EVENT_TYPES.ANALYTICS_REPORT_GENERATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "executive",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_HUB_REFRESHED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "observability",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_HEALTH_DEGRADED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "observability",
  },
  [OFFICIAL_ERP_EVENT_TYPES.OBSERVABILITY_INCIDENT_ESCALATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "observability",
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
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_RULE_TRIGGERED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_RULE_EXECUTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_RULE_FAILED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_WORKFLOW_STARTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_WORKFLOW_COMPLETED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_CROSS_DOMAIN_ORCHESTRATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_AI_RECOMMENDATION_GENERATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_AI_DECISION_SUPPORT_EMITTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.AUTOMATION_REPORT_GENERATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "automation",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_API_REGISTERED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_API_INVOKED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_INTEGRATION_CONNECTED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_CONNECTOR_HEALTH_DEGRADED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_CONNECTOR_SYNC_COMPLETED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_PLUGIN_INSTALLED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_MARKETPLACE_LISTING_PUBLISHED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_DEVELOPER_SANDBOX_READY]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
  },
  [OFFICIAL_ERP_EVENT_TYPES.PLATFORM_REPORT_GENERATED]: {
    family: "domain",
    sensitivity: "internal",
    owner: "platform",
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
