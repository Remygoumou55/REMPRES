/**
 * P2 — Ring buffer projections notification (read-only, pas de delivery).
 */

import type { ErpNotificationCandidate } from "@/lib/erp-core/events/foundation/notification-foundation";

export const NOTIFICATION_BRIDGE_LOG_VERSION = "notification-bridge-p2-v1" as const;

export type NotificationBridgeLogEntry = {
  id: string;
  at: string;
  consumerKey: string;
  mode: "read_only";
  candidate: ErpNotificationCandidate;
};

const RING_MAX = 200;
const ring: NotificationBridgeLogEntry[] = [];

export function appendNotificationBridgeLog(
  consumerKey: string,
  candidate: ErpNotificationCandidate,
): void {
  ring.push({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    consumerKey,
    mode: "read_only",
    candidate,
  });
  if (ring.length > RING_MAX) {
    ring.splice(0, ring.length - RING_MAX);
  }
}

export function getRecentNotificationBridgeLogs(limit = 50): readonly NotificationBridgeLogEntry[] {
  return ring.slice(-limit);
}

export function clearNotificationBridgeLogsForTests(): void {
  ring.length = 0;
}

/** Read-only — enregistre projection (P2/P2.1 bridges). */
export async function recordNotificationBridgeProjection(
  consumerKey: string,
  candidate: ErpNotificationCandidate,
): Promise<void> {
  appendNotificationBridgeLog(consumerKey, candidate);
}
