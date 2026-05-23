/**
 * P6 — Cartographie des 3 premières automations officielles.
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const FIRST_AUTOMATION_RULE_MAP_VERSION = "first-automation-rule-p6-v1" as const;

export type FirstAutomationRuleRow = {
  ruleKey: string;
  eventType: string;
  actionKey: string;
  handler: string;
  writeAuto: false;
  approvalBypass: false;
  outcome: string;
};

export const FIRST_AUTOMATION_RULE_MAP: readonly FirstAutomationRuleRow[] = [
  {
    ruleKey: "finance.threshold.exceeded.notify_cfo",
    eventType: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    actionKey: "automation.finance.threshold_notify",
    handler: "handleAutomationFinanceThresholdNotify",
    writeAuto: false,
    approvalBypass: false,
    outcome: "automation trace + notification bridge (P5) en parallèle",
  },
  {
    ruleKey: "approval.request.approved.post_candidate",
    eventType: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
    actionKey: "automation.approval.post_approved_candidate",
    handler: "handleAutomationApprovalPostApproved",
    writeAuto: false,
    approvalBypass: false,
    outcome: "candidat post-approval — pas de journal auto",
  },
  {
    ruleKey: "crm.quote.converted.sales_candidate",
    eventType: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED,
    actionKey: "automation.crm.quote_converted_sales",
    handler: "handleAutomationCrmQuoteConvertedSales",
    writeAuto: false,
    approvalBypass: false,
    outcome: "candidat refresh cockpit vente — pas de write sale",
  },
] as const;
