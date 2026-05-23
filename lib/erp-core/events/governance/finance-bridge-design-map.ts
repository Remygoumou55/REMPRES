/**
 * P5 — Design map bridge notification Finance.
 */

export const FINANCE_BRIDGE_DESIGN_MAP_VERSION = "finance-bridge-design-p5-v1" as const;

export type FinanceBridgeDesignEntry = {
  bridge: "notification-finance-bridge";
  pattern: "finance.*";
  consumerKey: "notification-finance-bridge";
  departmentScope: "FINANCE";
  mapper: "mapFinanceEventToNotificationCandidate";
  dispatch: "processNotificationBridgeCandidate";
  delivery: "deliverInAppNotification → governance_alerts";
  traceability: "notification-bridge-log ring + event trace handler_ok";
  lifecycle: "register on bootstrap → idempotent → active";
  security: "restricted events + departmentScope FINANCE";
};

export const FINANCE_BRIDGE_DESIGN_MAP: FinanceBridgeDesignEntry = {
  bridge: "notification-finance-bridge",
  pattern: "finance.*",
  consumerKey: "notification-finance-bridge",
  departmentScope: "FINANCE",
  mapper: "mapFinanceEventToNotificationCandidate",
  dispatch: "processNotificationBridgeCandidate",
  delivery: "deliverInAppNotification → governance_alerts",
  traceability: "notification-bridge-log ring + event trace handler_ok",
  lifecycle: "register on bootstrap → idempotent → active",
  security: "restricted events + departmentScope FINANCE",
};
