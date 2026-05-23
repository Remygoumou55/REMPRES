/**
 * P3 — Delivery in_app via gouvernance alerts (SoT UI notifications).
 */

import type {
  ErpNotificationCandidate,
  ErpNotificationChannel,
  ErpNotificationPriority,
} from "@/lib/erp-core/events/foundation/notification-foundation";
import { tryEmitGovernanceAlert } from "@/lib/governance/alert-engine";
import type { GovernanceAlertSeverity } from "@/lib/governance/alerts/types";

export type DeliverInAppNotificationInput = {
  candidate: ErpNotificationCandidate;
  triggeredBy?: string | null;
};

const TEMPLATE_TO_ALERT_TYPE: Record<string, string> = {
  "approval.request.created": "approval_request_created",
  "approval.request.approved": "approval_granted",
  "approval.request.rejected": "approval_rejected",
  "approval.gate.granted": "erp_approval_gate_granted",
  "crm.lead.created": "crm_lead_created",
  "crm.quote.created": "crm_quote_created",
  "crm.quote.status_updated": "crm_quote_status_updated",
  "crm.quote.convert_requested": "approval_request_created",
  "crm.quote.converted": "crm_quote_converted",
  "finance.expense.created": "finance_expense_created",
  "finance.expense.updated": "finance_expense_updated",
  "finance.transaction.recorded": "finance_transaction_recorded",
  "finance.transaction.failed": "finance_transaction_failed",
  "finance.threshold.exceeded": "finance_threshold_exceeded",
  "finance.payment.recorded": "finance_payment_recorded",
  "hr.leave.requested": "hr_leave_requested",
  "hr.leave.approved": "hr_leave_approved",
  "hr.contract.expiring": "hr_contract_expiring",
  "hr.contract.submitted": "hr_contract_submitted",
  "hr.contract.expired": "hr_contract_expired",
  "hr.contract.terminated": "hr_contract_terminated",
  "hr.contract.renewed": "hr_contract_renewed",
  "hr.recruitment.hire_submitted": "hr_recruitment_hire_submitted",
  "hr.employee.created": "hr_employee_created",
};

export function mapPriorityToAlertSeverity(priority: ErpNotificationPriority): GovernanceAlertSeverity {
  switch (priority) {
    case "low":
      return "low";
    case "normal":
      return "medium";
    case "high":
      return "high";
    case "critical":
      return "critical";
    default:
      return "medium";
  }
}

export function resolveGovernanceAlertType(candidate: ErpNotificationCandidate): string {
  return TEMPLATE_TO_ALERT_TYPE[candidate.templateKey] ?? `erp_${candidate.templateKey.replace(/\./g, "_")}`;
}

export async function deliverInAppNotification(input: DeliverInAppNotificationInput): Promise<{
  delivered: boolean;
  channel: ErpNotificationChannel;
}> {
  const { candidate } = input;
  const channel: ErpNotificationChannel = "in_app";

  await tryEmitGovernanceAlert({
    type: resolveGovernanceAlertType(candidate),
    departmentKey: candidate.departmentKey,
    title: candidate.title,
    description: candidate.body,
    entityType: candidate.entityType,
    entityId: candidate.entityId,
    triggeredBy: input.triggeredBy ?? null,
    metadata: {
      ...candidate.metadata,
      erp_notification_delivery: "p3_in_app",
      source_event_id: candidate.sourceEventId,
      source_event_type: candidate.sourceEventType,
      template_key: candidate.templateKey,
      recipient_scope: candidate.recipientScope,
    },
  });

  return { delivered: true, channel };
}
