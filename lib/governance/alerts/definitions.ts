import type {
  GovernanceAlertCategory,
  GovernanceAlertEscalation,
  GovernanceAlertSeverity,
} from "@/lib/governance/alerts/types";

export type GovernanceAlertDefinition = {
  type: string;
  titleKey: string;
  descriptionKey: string;
  category: GovernanceAlertCategory;
  severity: GovernanceAlertSeverity;
  escalation: GovernanceAlertEscalation;
};

const ALERT_DEFINITIONS: Record<string, GovernanceAlertDefinition> = {
  approval_request_created: {
    type: "approval_request_created",
    titleKey: "governance.alerts.type.approvalRequestCreated.title",
    descriptionKey: "governance.alerts.type.approvalRequestCreated.description",
    category: "GOVERNANCE",
    severity: "high",
    escalation: "dg_only",
  },
  approval_granted: {
    type: "approval_granted",
    titleKey: "governance.alerts.type.approvalGranted.title",
    descriptionKey: "governance.alerts.type.approvalGranted.description",
    category: "GOVERNANCE",
    severity: "medium",
    escalation: "dg_only",
  },
  erp_approval_gate_granted: {
    type: "erp_approval_gate_granted",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "GOVERNANCE",
    severity: "low",
    escalation: "manager",
  },
  approval_rejected: {
    type: "approval_rejected",
    titleKey: "governance.alerts.type.approvalRejected.title",
    descriptionKey: "governance.alerts.type.approvalRejected.description",
    category: "GOVERNANCE",
    severity: "critical",
    escalation: "dg_only",
  },
  crm_lead_created: {
    type: "crm_lead_created",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  crm_quote_created: {
    type: "crm_quote_created",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  crm_quote_status_updated: {
    type: "crm_quote_status_updated",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  crm_quote_converted: {
    type: "crm_quote_converted",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "high",
    escalation: "manager_and_dg",
  },
  finance_expense_created: {
    type: "finance_expense_created",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  finance_expense_updated: {
    type: "finance_expense_updated",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  finance_transaction_recorded: {
    type: "finance_transaction_recorded",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  finance_transaction_failed: {
    type: "finance_transaction_failed",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "high",
    escalation: "manager_and_dg",
  },
  finance_threshold_exceeded: {
    type: "finance_threshold_exceeded",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "high",
    escalation: "dg_only",
  },
  finance_payment_recorded: {
    type: "finance_payment_recorded",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "high",
    escalation: "manager_and_dg",
  },
  hr_leave_requested: {
    type: "hr_leave_requested",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager_and_dg",
  },
  hr_leave_approved: {
    type: "hr_leave_approved",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  hr_contract_expiring: {
    type: "hr_contract_expiring",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "high",
    escalation: "manager_and_dg",
  },
  hr_contract_submitted: {
    type: "hr_contract_submitted",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager_and_dg",
  },
  hr_contract_expired: {
    type: "hr_contract_expired",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  hr_contract_terminated: {
    type: "hr_contract_terminated",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "high",
    escalation: "manager_and_dg",
  },
  hr_contract_renewed: {
    type: "hr_contract_renewed",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "low",
    escalation: "manager",
  },
  hr_recruitment_hire_submitted: {
    type: "hr_recruitment_hire_submitted",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "high",
    escalation: "manager_and_dg",
  },
  hr_employee_created: {
    type: "hr_employee_created",
    titleKey: "governance.alerts.type.generic.title",
    descriptionKey: "governance.alerts.type.generic.description",
    category: "OPERATIONAL",
    severity: "medium",
    escalation: "manager",
  },
  security_access_denied: {
    type: "security_access_denied",
    titleKey: "governance.alerts.type.securityAccessDenied.title",
    descriptionKey: "governance.alerts.type.securityAccessDenied.description",
    category: "SECURITY",
    severity: "critical",
    escalation: "dg_only",
  },
};

export function getAlertDefinition(type: string): GovernanceAlertDefinition {
  return (
    ALERT_DEFINITIONS[type] ?? {
      type,
      titleKey: "governance.alerts.type.generic.title",
      descriptionKey: "governance.alerts.type.generic.description",
      category: "SYSTEM",
      severity: "medium",
      escalation: "manager_and_dg",
    }
  );
}
