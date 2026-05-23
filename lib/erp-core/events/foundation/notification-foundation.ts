/**
 * B3.2+ — Fondation notifications (design contracts — pas de build UI/center).
 *
 * Pattern cible :
 *   ErpEvent → (optionnel) NotificationCandidate → Handler → NotificationService
 */

import type { ErpEventEnvelope, NotificationCandidateEvent } from "@/lib/erp-core/events/event-contracts";

export const ERP_NOTIFICATION_FOUNDATION_VERSION = "erp-notification-foundation-b3.2-plus-v1" as const;

export type ErpNotificationChannel = "in_app" | "email" | "sms" | "push";

export type ErpNotificationPriority = "low" | "normal" | "high" | "critical";

/** Projection métier dérivée d'un événement bus (pas persistée en B3.2+). */
export type ErpNotificationCandidate = {
  sourceEventId: string;
  sourceEventType: string;
  departmentKey: string | null;
  recipientScope: "actor" | "approvers" | "department" | "super_admin";
  templateKey: string;
  title: string;
  body: string;
  priority: ErpNotificationPriority;
  channels: ErpNotificationChannel[];
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
};

export type ErpNotificationCandidateMapper = (
  event: ErpEventEnvelope,
) => ErpNotificationCandidate | null;

export type ErpNotificationHandler = (candidate: ErpNotificationCandidate) => Promise<void>;

/** Service cible — implémentation = phase Notification (hors B3.2+). */
export type ErpNotificationService = {
  deliver(candidate: ErpNotificationCandidate): Promise<{ delivered: boolean; channel: ErpNotificationChannel }>;
};

export type ErpNotificationHandlerRegistration = {
  consumerKey: string;
  /** Patterns bus écoutés (ex. approval.request.*). */
  pattern: string;
  mapper: ErpNotificationCandidateMapper;
  handler: ErpNotificationHandler;
  departmentScope?: string | null;
};

/** Pont type vers famille notification_candidate du bus. */
export function asNotificationCandidateEnvelope(
  event: ErpEventEnvelope,
): NotificationCandidateEvent | null {
  if (event.family !== "notification_candidate") return null;
  return event as NotificationCandidateEvent;
}
