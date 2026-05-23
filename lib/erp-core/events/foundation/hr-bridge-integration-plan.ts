/**
 * P7.2 — Plan d'intégration bridge RH (bootstrap automatique).
 */

export const HR_BRIDGE_INTEGRATION_PLAN_VERSION = "hr-bridge-integration-p7-2-v1" as const;

export type HrBridgeIntegrationStep = {
  step: number;
  action: string;
  file: string;
  status: "done" | "pending";
  notes: string;
};

export const HR_BRIDGE_INTEGRATION_STEPS: readonly HrBridgeIntegrationStep[] = [
  {
    step: 1,
    action: "Créer mapHrEventToNotificationCandidate",
    file: "handlers/notification-hr-bridge.ts",
    status: "done",
    notes: "leave.requested, leave.approved, contract.expiring",
  },
  {
    step: 2,
    action: "registerNotificationHrBridgeHandler",
    file: "handlers/notification-hr-bridge.ts",
    status: "done",
    notes: "pattern hr.*, scope RH",
  },
  {
    step: 3,
    action: "Bootstrap idempotent",
    file: "bootstrap/register-default-handlers.ts",
    status: "done",
    notes: "erp-event-handlers-bootstrap-p7-2-v1",
  },
  {
    step: 4,
    action: "TEMPLATE_TO_ALERT_TYPE + definitions",
    file: "delivery/in-app-notification-service.ts, governance/alerts/definitions.ts",
    status: "done",
    notes: "3 alert types hr_* actifs",
  },
  {
    step: 5,
    action: "Tests P7.2 bridge + bootstrap",
    file: "tests/unit/p7-2-hr-notification-bridge.test.ts",
    status: "done",
    notes: "awaitDispatch true en test",
  },
] as const;

export const HR_BRIDGE_INTEGRATION_CHECKS = {
  idempotency: "hasHandler(NOTIFICATION_HR_BRIDGE_CONSUMER_KEY) avant register",
  runtimeSafety: "mapper null → early return, pas de delivery",
  dispatchCompatibility: "processNotificationBridgeCandidate inchangé P3",
  noManualBootstrap: "aucun register manuel hors ensureErpEventHandlersBootstrapped",
  legacyCoexistence: "tryCreateAlert contrats conservé jusqu'à P7.3 expiring wire",
} as const;
