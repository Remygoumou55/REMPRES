/**
 * P7.2 — Design map bridge notification RH.
 */

export const HR_BRIDGE_DESIGN_MAP_VERSION = "hr-bridge-design-p7-2-v1" as const;

export type HrBridgeDesignEntry = {
  bridge: "notification-hr-bridge";
  pattern: "hr.*";
  consumerKey: "notification-hr-bridge";
  departmentScope: "RH";
  mapper: "mapHrEventToNotificationCandidate";
  dispatch: "processNotificationBridgeCandidate";
  delivery: "deliverInAppNotification → governance_alerts";
  traceability: "notification-bridge-log ring + event trace handler_ok";
  lifecycle: "register on bootstrap → idempotent → active";
  security: "restricted events + departmentScope RH";
};

export const HR_BRIDGE_DESIGN_MAP: HrBridgeDesignEntry = {
  bridge: "notification-hr-bridge",
  pattern: "hr.*",
  consumerKey: "notification-hr-bridge",
  departmentScope: "RH",
  mapper: "mapHrEventToNotificationCandidate",
  dispatch: "processNotificationBridgeCandidate",
  delivery: "deliverInAppNotification → governance_alerts",
  traceability: "notification-bridge-log ring + event trace handler_ok",
  lifecycle: "register on bootstrap → idempotent → active",
  security: "restricted events + departmentScope RH",
};
