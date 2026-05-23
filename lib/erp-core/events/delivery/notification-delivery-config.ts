/**
 * P3 — Configuration delivery notifications in_app.
 */

export const ERP_NOTIFICATION_DELIVERY_VERSION = "erp-notification-delivery-p3-v1" as const;

/** Désactiver via ERP_NOTIFICATION_IN_APP_DELIVERY=false */
export function isErpInAppNotificationDeliveryEnabled(): boolean {
  return process.env.ERP_NOTIFICATION_IN_APP_DELIVERY !== "false";
}
