/**
 * P7 / P7.2 — HR_NOTIFICATION_READINESS_MAP (compatibilité P2–P5).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const HR_NOTIFICATION_READINESS_MAP_VERSION = "hr-notification-readiness-p7-2-v1" as const;

export type HrNotificationReadinessRow = {
  eventType: string;
  candidate: boolean;
  templateKey: string;
  title: string;
  priority: "normal" | "high";
  recipientScope: "department" | "hr_admin" | "super_admin" | "approvers";
  alertType: string;
  target: string;
  routing: string;
  bridgePhase: "readiness" | "active";
};

export const HR_NOTIFICATION_READINESS_MAP: readonly HrNotificationReadinessRow[] = [
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    candidate: true,
    templateKey: "hr.contract.expiring",
    title: "Contrat arrivant à échéance",
    priority: "high",
    recipientScope: "hr_admin",
    alertType: "hr_contract_expiring",
    target: "RH managers / dept RH",
    routing: "governance_alerts in_app — remplace rh_contract_renewal_due legacy",
    bridgePhase: "active",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
    candidate: true,
    templateKey: "hr.leave.requested",
    title: "Demande de congé",
    priority: "normal",
    recipientScope: "approvers",
    alertType: "hr_leave_requested",
    target: "RH approvers + super_admin",
    routing: "governance_alerts in_app",
    bridgePhase: "active",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    candidate: true,
    templateKey: "hr.leave.approved",
    title: "Congé approuvé",
    priority: "normal",
    recipientScope: "department",
    alertType: "hr_leave_approved",
    target: "demandeur + dept RH",
    routing: "governance_alerts in_app",
    bridgePhase: "active",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED,
    candidate: false,
    templateKey: "hr.employee.created",
    title: "Nouveau collaborateur",
    priority: "normal",
    recipientScope: "hr_admin",
    alertType: "hr_employee_created",
    target: "RH admin",
    routing: "P9+ — bruit faible",
    bridgePhase: "readiness",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED,
    candidate: false,
    templateKey: "hr.contract.created",
    title: "Contrat créé",
    priority: "normal",
    recipientScope: "hr_admin",
    alertType: "hr_contract_created",
    target: "RH admin",
    routing: "P9+ — pending_approval couvre le flux",
    bridgePhase: "readiness",
  },
] as const;

export const HR_NOTIFICATION_READINESS_SUMMARY = {
  minimumCandidatesMet: HR_NOTIFICATION_READINESS_MAP.filter((r) => r.candidate).length >= 3,
  bridgeHandler: "handlers/notification-hr-bridge.ts",
  bridgeActive: HR_NOTIFICATION_READINESS_MAP.filter((r) => r.bridgePhase === "active").length >= 3,
  pattern: "hr.* → processNotificationBridgeCandidate",
  rebuildBridgeForbidden: true,
} as const;
