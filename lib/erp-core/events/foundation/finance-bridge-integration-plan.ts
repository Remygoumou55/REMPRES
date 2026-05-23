/**
 * P5 — Plan d'intégration bridge Finance (bootstrap automatique).
 */

export const FINANCE_BRIDGE_INTEGRATION_PLAN_VERSION = "finance-bridge-integration-p5-v1" as const;

export type FinanceBridgeIntegrationStep = {
  step: number;
  action: string;
  file: string;
  status: "done" | "pending";
  notes: string;
};

export const FINANCE_BRIDGE_INTEGRATION_STEPS: readonly FinanceBridgeIntegrationStep[] = [
  {
    step: 1,
    action: "Créer mapFinanceEventToNotificationCandidate",
    file: "handlers/notification-finance-bridge.ts",
    status: "done",
    notes: "6 types finance.* mappés",
  },
  {
    step: 2,
    action: "registerNotificationFinanceBridgeHandler",
    file: "handlers/notification-finance-bridge.ts",
    status: "done",
    notes: "pattern finance.*, scope FINANCE",
  },
  {
    step: 3,
    action: "Bootstrap idempotent",
    file: "bootstrap/register-default-handlers.ts",
    status: "done",
    notes: "ensureErpEventHandlersBootstrapped au publish",
  },
  {
    step: 4,
    action: "TEMPLATE_TO_ALERT_TYPE + definitions",
    file: "delivery/in-app-notification-service.ts, governance/alerts/definitions.ts",
    status: "done",
    notes: "6 alert types finance_*",
  },
  {
    step: 5,
    action: "Tests P5 bridge + bootstrap",
    file: "tests/unit/p5-finance-notification-bridge.test.ts",
    status: "done",
    notes: "awaitDispatch true en test",
  },
] as const;

export const FINANCE_BRIDGE_INTEGRATION_CHECKS = {
  idempotency: "hasHandler(NOTIFICATION_FINANCE_BRIDGE_CONSUMER_KEY) avant register",
  runtimeSafety: "mapper null → early return, pas de delivery",
  dispatchCompatibility: "processNotificationBridgeCandidate inchangé P3",
  noManualBootstrap: "aucun register manuel hors ensureErpEventHandlersBootstrapped",
} as const;
