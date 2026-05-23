/**
 * P7.3 — Cartographie règles automation RH (read-safe).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const HR_AUTOMATION_RULE_MAP_VERSION = "hr-automation-rule-p7-3-v1" as const;

export type HrAutomationRuleRow = {
  ruleKey: string;
  eventType: string;
  actionKey: string;
  handler: string;
  writeAuto: false;
  approvalBypass: false;
  outcome: string;
};

export const HR_AUTOMATION_RULE_MAP: readonly HrAutomationRuleRow[] = [
  {
    ruleKey: "hr.contract.expiring.reminder",
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    actionKey: "automation.hr.contract_expiring_reminder",
    handler: "handleAutomationHrContractExpiringReminder",
    writeAuto: false,
    approvalBypass: false,
    outcome: "automation trace + notification-hr-bridge (P7.2)",
  },
  {
    ruleKey: "hr.leave.approved.post",
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    actionKey: "automation.hr.leave_approved_post",
    handler: "handleAutomationHrLeaveApprovedPost",
    writeAuto: false,
    approvalBypass: false,
    outcome: "candidat calendrier RH — pas de write leave",
  },
] as const;
