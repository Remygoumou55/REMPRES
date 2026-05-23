/**
 * P6 — Handlers d'action automation (1 action = 1 responsabilité, read-safe).
 */

import type { ErpAutomationExecutionContext } from "@/lib/erp-core/events/foundation/automation-foundation";
import { appendAutomationTrace } from "@/lib/erp-core/events/automation/automation-trace-log";

export type AutomationActionHandler = (ctx: ErpAutomationExecutionContext) => Promise<void>;

/** Seuil CFO — trace + métadonnées (notification = bridge P5). */
export const handleAutomationFinanceThresholdNotify: AutomationActionHandler = async (ctx) => {
  appendAutomationTrace({
    ruleKey: ctx.rule.key,
    actionKey: ctx.rule.actionKey,
    eventId: ctx.event.id,
    eventType: ctx.event.type,
    entityType: ctx.event.entityType,
    entityId: ctx.event.entityId,
    outcome: "executed",
    detail: "cfo_threshold_automation_trace",
    metadata: {
      threshold_key: ctx.event.payload.threshold_key,
      actual_gnf: ctx.event.payload.actual_gnf,
      threshold_gnf: ctx.event.payload.threshold_gnf,
      notify_via: "notification-finance-bridge (parallel)",
    },
  });
};

/** Post-approval — candidat uniquement, pas de mutation auto. */
export const handleAutomationApprovalPostApproved: AutomationActionHandler = async (ctx) => {
  const mutationAction = String(
    ctx.event.payload.mutationAction ?? ctx.event.payload.mutation_action ?? "",
  );
  appendAutomationTrace({
    ruleKey: ctx.rule.key,
    actionKey: ctx.rule.actionKey,
    eventId: ctx.event.id,
    eventType: ctx.event.type,
    entityType: ctx.event.entityType,
    entityId: ctx.event.entityId,
    outcome: "executed",
    detail: "post_approval_candidate",
    metadata: {
      mutation_action: mutationAction || null,
      write_forbidden: true,
      next_step: "manual_or_future_p4_2_journal",
    },
  });
};

/** Vente — candidat refresh cockpit / suivi sale (pas de write). */
export const handleAutomationCrmQuoteConvertedSales: AutomationActionHandler = async (ctx) => {
  appendAutomationTrace({
    ruleKey: ctx.rule.key,
    actionKey: ctx.rule.actionKey,
    eventId: ctx.event.id,
    eventType: ctx.event.type,
    entityType: ctx.event.entityType,
    entityId: ctx.event.entityId,
    outcome: "executed",
    detail: "sales_automation_candidate",
    metadata: {
      sale_id: ctx.event.payload.sale_id,
      sale_reference: ctx.event.payload.sale_reference,
      refresh_target: "vente_cockpit_runtime",
    },
  });
};

/** RH — rappel échéance contrat (notification = bridge P7.2). */
export const handleAutomationHrContractExpiringReminder: AutomationActionHandler = async (ctx) => {
  appendAutomationTrace({
    ruleKey: ctx.rule.key,
    actionKey: ctx.rule.actionKey,
    eventId: ctx.event.id,
    eventType: ctx.event.type,
    entityType: ctx.event.entityType,
    entityId: ctx.event.entityId,
    outcome: "executed",
    detail: "hr_contract_expiring_reminder",
    metadata: {
      contract_id: ctx.event.payload.contract_id,
      employee_id: ctx.event.payload.employee_id,
      end_date: ctx.event.payload.end_date,
      days_until_expiry: ctx.event.payload.days_until_expiry,
      notify_via: "notification-hr-bridge (parallel)",
      write_forbidden: true,
    },
  });
};

/** RH — post-approbation congé (calendrier / planning — read-safe). */
export const handleAutomationHrLeaveApprovedPost: AutomationActionHandler = async (ctx) => {
  appendAutomationTrace({
    ruleKey: ctx.rule.key,
    actionKey: ctx.rule.actionKey,
    eventId: ctx.event.id,
    eventType: ctx.event.type,
    entityType: ctx.event.entityType,
    entityId: ctx.event.entityId,
    outcome: "executed",
    detail: "hr_leave_approved_post_candidate",
    metadata: {
      leave_id: ctx.event.payload.leave_id,
      employee_id: ctx.event.payload.employee_id,
      from_status: ctx.event.payload.from_status,
      to_status: ctx.event.payload.to_status,
      refresh_target: "rh_leave_calendar",
      write_forbidden: true,
    },
  });
};

export const AUTOMATION_ACTION_HANDLERS: Record<string, AutomationActionHandler> = {
  "automation.finance.threshold_notify": handleAutomationFinanceThresholdNotify,
  "automation.approval.post_approved_candidate": handleAutomationApprovalPostApproved,
  "automation.crm.quote_converted_sales": handleAutomationCrmQuoteConvertedSales,
  "automation.hr.contract_expiring_reminder": handleAutomationHrContractExpiringReminder,
  "automation.hr.leave_approved_post": handleAutomationHrLeaveApprovedPost,
};
