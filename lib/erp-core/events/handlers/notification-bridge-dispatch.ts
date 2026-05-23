/**
 * P3 — Dispatch bridge : trace read-only + delivery in_app optionnelle.
 */

import type { ErpNotificationCandidate } from "@/lib/erp-core/events/foundation/notification-foundation";
import { isErpInAppNotificationDeliveryEnabled } from "@/lib/erp-core/events/delivery/notification-delivery-config";
import { deliverInAppNotification } from "@/lib/erp-core/events/delivery/in-app-notification-service";
import { recordNotificationBridgeProjection } from "@/lib/erp-core/events/handlers/notification-bridge-log";

/** Pas de delivery in_app — trace bridge uniquement (évite alertes trompeuses / bruit). */
export const NOTIFICATION_BRIDGE_SKIP_IN_APP_TEMPLATES = new Set([
  "approval.gate.granted",
]);

export type ProcessNotificationBridgeInput = {
  consumerKey: string;
  candidate: ErpNotificationCandidate;
  triggeredBy?: string | null;
  deliverInApp?: boolean;
  /** true = attendre delivery (tests). false = arrière-plan (prod). */
  awaitDelivery?: boolean;
};

export async function processNotificationBridgeCandidate(
  input: ProcessNotificationBridgeInput,
): Promise<void> {
  recordNotificationBridgeProjection(input.consumerKey, input.candidate);

  if (NOTIFICATION_BRIDGE_SKIP_IN_APP_TEMPLATES.has(input.candidate.templateKey)) {
    return;
  }

  const shouldDeliver = input.deliverInApp ?? isErpInAppNotificationDeliveryEnabled();
  if (!shouldDeliver) return;

  const delivery = deliverInAppNotification({
    candidate: input.candidate,
    triggeredBy: input.triggeredBy ?? null,
  });

  const onError = (err: unknown) => {
    console.warn(
      "[erp-notification-bridge:delivery]",
      input.candidate.templateKey,
      err instanceof Error ? err.message : err,
    );
  };

  if (input.awaitDelivery === true) {
    await delivery.catch(onError);
  } else {
    void delivery.catch(onError);
  }
}
