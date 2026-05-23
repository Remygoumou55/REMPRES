/**
 * P7.2 — Gouvernance notification RH (bridgeable / catalog / delivery).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const HR_NOTIFICATION_GOVERNANCE_MAP_VERSION = "hr-notification-governance-p7-2-v1" as const;

export type HrNotificationGovernanceStatus =
  | "bridgeable_active"
  | "bridgeable_catalog_only"
  | "future_delivery"
  | "blocked";

export type HrNotificationGovernanceEntry = {
  eventType: string;
  status: HrNotificationGovernanceStatus;
  owner: "hr";
  departmentKey: "RH";
  bridgeConsumer: "notification-hr-bridge";
  templateKey: string;
  priority: "low" | "normal" | "high" | "critical";
  recipientScope: "department" | "super_admin" | "actor" | "approvers";
  routing: string;
  visibility: "internal" | "restricted";
  inAppDelivery: boolean;
};

export const HR_NOTIFICATION_GOVERNANCE_MAP: readonly HrNotificationGovernanceEntry[] = [
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
    status: "bridgeable_active",
    owner: "hr",
    departmentKey: "RH",
    bridgeConsumer: "notification-hr-bridge",
    templateKey: "hr.leave.requested",
    priority: "normal",
    recipientScope: "approvers",
    routing: "hr.* → dispatch → governance_alerts",
    visibility: "restricted",
    inAppDelivery: true,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    status: "bridgeable_active",
    owner: "hr",
    departmentKey: "RH",
    bridgeConsumer: "notification-hr-bridge",
    templateKey: "hr.leave.approved",
    priority: "normal",
    recipientScope: "department",
    routing: "hr.* → dispatch → governance_alerts",
    visibility: "restricted",
    inAppDelivery: true,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    status: "bridgeable_active",
    owner: "hr",
    departmentKey: "RH",
    bridgeConsumer: "notification-hr-bridge",
    templateKey: "hr.contract.expiring",
    priority: "high",
    recipientScope: "department",
    routing: "hr.* → dispatch — émission P7.3",
    visibility: "restricted",
    inAppDelivery: true,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED,
    status: "future_delivery",
    owner: "hr",
    departmentKey: "RH",
    bridgeConsumer: "notification-hr-bridge",
    templateKey: "hr.contract.created",
    priority: "normal",
    recipientScope: "department",
    routing: "P9+ — pending_approval couvre le flux",
    visibility: "restricted",
    inAppDelivery: false,
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED,
    status: "future_delivery",
    owner: "hr",
    departmentKey: "RH",
    bridgeConsumer: "notification-hr-bridge",
    templateKey: "hr.employee.updated",
    priority: "normal",
    recipientScope: "department",
    routing: "P9+ — bruit faible",
    visibility: "restricted",
    inAppDelivery: false,
  },
] as const;

export function listHrBridgeableActiveNotifications(): HrNotificationGovernanceEntry[] {
  return HR_NOTIFICATION_GOVERNANCE_MAP.filter((e) => e.status === "bridgeable_active");
}
