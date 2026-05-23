/**
 * P5 — Cartographie candidats notification Finance (ErpNotificationCandidate).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const FINANCE_NOTIFICATION_CANDIDATE_MAP_VERSION = "finance-notification-candidate-p5-v1" as const;

export type FinanceNotificationCandidateRow = {
  eventType: string;
  templateKey: string;
  title: string;
  recipientScope: "department" | "super_admin" | "actor" | "approvers";
  priority: "normal" | "high";
  alertType: string;
  target: string;
  routing: string;
};

export const FINANCE_NOTIFICATION_CANDIDATE_MAP: readonly FinanceNotificationCandidateRow[] = [
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
    templateKey: "finance.expense.created",
    title: "Nouvelle dépense",
    recipientScope: "department",
    priority: "normal",
    alertType: "finance_expense_created",
    target: "finance_manager / dept FINANCE",
    routing: "governance_alerts in_app",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED,
    templateKey: "finance.expense.updated",
    title: "Dépense modifiée",
    recipientScope: "department",
    priority: "normal",
    alertType: "finance_expense_updated",
    target: "finance_manager / dept FINANCE",
    routing: "governance_alerts in_app",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    templateKey: "finance.threshold.exceeded",
    title: "Seuil financier dépassé",
    recipientScope: "super_admin",
    priority: "high",
    alertType: "finance_threshold_exceeded",
    target: "CFO / super_admin",
    routing: "governance_alerts in_app — escalation dg_only",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED,
    templateKey: "finance.transaction.failed",
    title: "Échec transaction finance",
    recipientScope: "super_admin",
    priority: "high",
    alertType: "finance_transaction_failed",
    target: "CFO / super_admin",
    routing: "governance_alerts in_app",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    templateKey: "finance.transaction.recorded",
    title: "Transaction enregistrée",
    recipientScope: "department",
    priority: "normal",
    alertType: "finance_transaction_recorded",
    target: "dept FINANCE",
    routing: "governance_alerts — actif P4.2+",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED,
    templateKey: "finance.payment.recorded",
    title: "Paiement enregistré",
    recipientScope: "department",
    priority: "high",
    alertType: "finance_payment_recorded",
    target: "dept FINANCE",
    routing: "governance_alerts — actif P4.2+",
  },
] as const;
