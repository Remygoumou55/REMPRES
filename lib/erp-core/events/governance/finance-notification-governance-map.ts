/**
 * P5 — Gouvernance notification Finance (classifier bridgeable / catalog / delivery).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const FINANCE_NOTIFICATION_GOVERNANCE_MAP_VERSION = "finance-notification-governance-p5-v1" as const;

export type FinanceNotificationGovernanceStatus =
  | "bridgeable_active"
  | "bridgeable_catalog_only"
  | "future_delivery"
  | "blocked";

export type FinanceNotificationGovernanceEntry = {
  eventType: string;
  status: FinanceNotificationGovernanceStatus;
  owner: "finance";
  departmentKey: "FINANCE";
  bridgeConsumer: "notification-finance-bridge";
  templateKey: string;
  priority: "low" | "normal" | "high" | "critical";
  recipientScope: "department" | "super_admin" | "actor" | "approvers";
  routing: string;
  visibility: "internal" | "restricted";
  inAppDelivery: boolean;
};

export const FINANCE_NOTIFICATION_GOVERNANCE_MAP: readonly FinanceNotificationGovernanceEntry[] = [
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
    status: "bridgeable_active",
    owner: "finance",
    departmentKey: "FINANCE",
    bridgeConsumer: "notification-finance-bridge",
    templateKey: "finance.expense.created",
    priority: "normal",
    recipientScope: "department",
    routing: "finance.* → dispatch → governance_alerts",
    visibility: "restricted",
    inAppDelivery: true,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED,
    status: "bridgeable_active",
    owner: "finance",
    departmentKey: "FINANCE",
    bridgeConsumer: "notification-finance-bridge",
    templateKey: "finance.expense.updated",
    priority: "normal",
    recipientScope: "department",
    routing: "finance.* → dispatch → governance_alerts",
    visibility: "restricted",
    inAppDelivery: true,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    status: "bridgeable_catalog_only",
    owner: "finance",
    departmentKey: "FINANCE",
    bridgeConsumer: "notification-finance-bridge",
    templateKey: "finance.transaction.recorded",
    priority: "normal",
    recipientScope: "department",
    routing: "actif quand publisher P4.2 émet",
    visibility: "restricted",
    inAppDelivery: true,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED,
    status: "bridgeable_catalog_only",
    owner: "finance",
    departmentKey: "FINANCE",
    bridgeConsumer: "notification-finance-bridge",
    templateKey: "finance.transaction.failed",
    priority: "high",
    recipientScope: "super_admin",
    routing: "CFO / super_admin — actif quand publisher émet",
    visibility: "restricted",
    inAppDelivery: true,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    status: "bridgeable_active",
    owner: "finance",
    departmentKey: "FINANCE",
    bridgeConsumer: "notification-finance-bridge",
    templateKey: "finance.threshold.exceeded",
    priority: "high",
    recipientScope: "super_admin",
    routing: "P6.1 evaluator → bus → bridge + automation",
    visibility: "restricted",
    inAppDelivery: true,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED,
    status: "bridgeable_catalog_only",
    owner: "finance",
    departmentKey: "FINANCE",
    bridgeConsumer: "notification-finance-bridge",
    templateKey: "finance.payment.recorded",
    priority: "high",
    recipientScope: "department",
    routing: "actif quand payment.allocate P4.2",
    visibility: "restricted",
    inAppDelivery: true,
  },
] as const;

export const FINANCE_NOTIFICATION_GOVERNANCE_SUMMARY = {
  totalFinanceEvents: FINANCE_NOTIFICATION_GOVERNANCE_MAP.length,
  bridgeableActive: FINANCE_NOTIFICATION_GOVERNANCE_MAP.filter((e) => e.status === "bridgeable_active")
    .length,
  bridgeableCatalogOnly: FINANCE_NOTIFICATION_GOVERNANCE_MAP.filter(
    (e) => e.status === "bridgeable_catalog_only",
  ).length,
  freeNotificationsForbidden: true,
} as const;
