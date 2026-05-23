/**
 * P6 — Plan bootstrap automation handlers.
 */

export const AUTOMATION_BOOTSTRAP_PLAN_VERSION = "automation-bootstrap-p6-v1" as const;

export const AUTOMATION_BOOTSTRAP_STEPS = [
  {
    step: 1,
    action: "registerErpAutomationEngineHandler",
    file: "handlers/automation-engine-handler.ts",
    pattern: "*",
    consumerKey: "erp-automation-engine",
    status: "done" as const,
  },
  {
    step: 2,
    action: "ensureErpEventHandlersBootstrapped — idempotent",
    file: "bootstrap/register-default-handlers.ts",
    status: "done" as const,
  },
  {
    step: 3,
    action: "Pas de register manuel ailleurs",
    file: "—",
    status: "done" as const,
  },
] as const;

export const AUTOMATION_BOOTSTRAP_CHECKS = {
  idempotency: "hasHandler(erp-automation-engine) avant register",
  isolation: "dispatcher try/catch par handler — inchangé",
  handlerIsolation: "automation engine séparé des notification bridges",
} as const;
