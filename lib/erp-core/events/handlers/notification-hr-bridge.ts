/**
 * P7.2 — Notification bridge RH (map → trace → dispatch → delivery in_app).
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";
import type { ErpNotificationCandidate } from "@/lib/erp-core/events/foundation/notification-foundation";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { HR_DEPARTMENT_KEY } from "@/lib/hr/governance/hr-domain-governance";
import { registerErpEventHandler } from "@/lib/erp-core/events/event-registry";
import { processNotificationBridgeCandidate } from "@/lib/erp-core/events/handlers/notification-bridge-dispatch";

export const NOTIFICATION_HR_BRIDGE_CONSUMER_KEY = "notification-hr-bridge" as const;
export const NOTIFICATION_HR_BRIDGE_PATTERN = "hr.*" as const;

function entityLabel(event: ErpEventEnvelope): string {
  const id = event.entityId?.slice(0, 8) ?? "?";
  return `${event.entityType ?? "entity"}:${id}`;
}

function formatDate(value: unknown): string {
  const s = String(value ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("fr-FR");
}

export function mapHrEventToNotificationCandidate(
  event: ErpEventEnvelope,
): ErpNotificationCandidate | null {
  if (!event.type.startsWith("hr.")) return null;

  const base = {
    sourceEventId: event.id,
    sourceEventType: event.type,
    departmentKey: event.departmentKey ?? HR_DEPARTMENT_KEY,
    entityType: event.entityType,
    entityId: event.entityId,
    channels: ["in_app"] as const,
    metadata: { ...event.payload, correlation_id: event.correlationId },
  };

  switch (event.type) {
    case OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED:
      return {
        ...base,
        recipientScope: "approvers",
        templateKey: "hr.leave.requested",
        title: "Demande de congé",
        body: `${String(event.payload.leave_type ?? "congé")} — ${formatDate(event.payload.start_date)} → ${formatDate(event.payload.end_date)} (${entityLabel(event)})`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "hr.leave.approved",
        title: "Congé approuvé",
        body: `Congé approuvé pour ${String(event.payload.employee_id ?? "").slice(0, 8) || entityLabel(event)}`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "hr.contract.expiring",
        title: "Contrat arrivant à échéance",
        body: `Échéance ${formatDate(event.payload.end_date)} — J-${String(event.payload.days_until_expiry ?? "?")} (${entityLabel(event)})`,
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_SUBMITTED:
      return {
        ...base,
        recipientScope: "approvers",
        templateKey: "hr.contract.submitted",
        title: "Contrat en attente d'approbation",
        body: `Contrat soumis pour validation gouvernance (${entityLabel(event)})`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "hr.contract.expired",
        title: "Contrat expiré",
        body: `Contrat expiré — suivi RH requis (${entityLabel(event)})`,
        priority: "normal",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_TERMINATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "hr.contract.terminated",
        title: "Contrat terminé",
        body: `Contrat terminé (${entityLabel(event)})`,
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_RENEWED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "hr.contract.renewed",
        title: "Contrat renouvelé",
        body: `Nouvelle échéance ${formatDate(event.payload.new_end_date)} (${entityLabel(event)})`,
        priority: "low",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.HR_RECRUITMENT_HIRE_SUBMITTED:
      return {
        ...base,
        recipientScope: "approvers",
        templateKey: "hr.recruitment.hire_submitted",
        title: "Embauche en attente super-admin",
        body: `Embauche ${String(event.payload.candidate_name ?? "candidat")} — validation requise`,
        priority: "high",
        channels: [...base.channels],
      };
    case OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED:
      return {
        ...base,
        recipientScope: "department",
        templateKey: "hr.employee.created",
        title: "Collaborateur rattaché (onboarding)",
        body: `Profil ${String(event.payload.employee_id ?? "").slice(0, 8) || entityLabel(event)} lié au recrutement`,
        priority: "normal",
        channels: [...base.channels],
      };
    default:
      return null;
  }
}

export function registerNotificationHrBridgeHandler(): string {
  return registerErpEventHandler({
    pattern: NOTIFICATION_HR_BRIDGE_PATTERN,
    consumerKey: NOTIFICATION_HR_BRIDGE_CONSUMER_KEY,
    departmentScope: HR_DEPARTMENT_KEY,
    handler: async (event) => {
      const candidate = mapHrEventToNotificationCandidate(event);
      if (!candidate) return;
      await processNotificationBridgeCandidate({
        consumerKey: NOTIFICATION_HR_BRIDGE_CONSUMER_KEY,
        candidate,
        triggeredBy: event.actorUserId,
      });
    },
  });
}
