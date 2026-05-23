/**
 * P6 — Design map handlers automation (1 handler action = 1 responsabilité).
 */

export const AUTOMATION_HANDLER_DESIGN_MAP_VERSION = "automation-handler-design-p7-3-v1" as const;

export type AutomationHandlerDesignEntry = {
  actionKey: string;
  handlerFn: string;
  owner: string;
  runtimeAccess: "read_safe";
  guardrails: readonly string[];
  mayPublishEvents: false;
  mayMutateDb: false;
};

export const AUTOMATION_HANDLER_DESIGN_MAP: readonly AutomationHandlerDesignEntry[] = [
  {
    actionKey: "automation.finance.threshold_notify",
    handlerFn: "handleAutomationFinanceThresholdNotify",
    owner: "finance",
    runtimeAccess: "read_safe",
    guardrails: [
      "appendAutomationTrace only",
      "notification via finance bridge — pas duplicate tryCreateAlert",
    ],
    mayPublishEvents: false,
    mayMutateDb: false,
  },
  {
    actionKey: "automation.approval.post_approved_candidate",
    handlerFn: "handleAutomationApprovalPostApproved",
    owner: "approval-engine",
    runtimeAccess: "read_safe",
    guardrails: ["metadata write_forbidden", "no assertErpMutationApprovalGate bypass"],
    mayPublishEvents: false,
    mayMutateDb: false,
  },
  {
    actionKey: "automation.crm.quote_converted_sales",
    handlerFn: "handleAutomationCrmQuoteConvertedSales",
    owner: "vente-crm",
    runtimeAccess: "read_safe",
    guardrails: ["cockpit refresh = candidate trace only", "no crm write"],
    mayPublishEvents: false,
    mayMutateDb: false,
  },
  {
    actionKey: "automation.hr.contract_expiring_reminder",
    handlerFn: "handleAutomationHrContractExpiringReminder",
    owner: "hr",
    runtimeAccess: "read_safe",
    guardrails: [
      "appendAutomationTrace only",
      "notification via hr bridge — pas tryCreateAlert renewal",
    ],
    mayPublishEvents: false,
    mayMutateDb: false,
  },
  {
    actionKey: "automation.hr.leave_approved_post",
    handlerFn: "handleAutomationHrLeaveApprovedPost",
    owner: "hr",
    runtimeAccess: "read_safe",
    guardrails: ["calendrier RH = candidate trace", "no leave write"],
    mayPublishEvents: false,
    mayMutateDb: false,
  },
] as const;
