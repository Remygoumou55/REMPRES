/**
 * P6 — Catalogue gouverné des règles automation ERP.
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import type { ErpAutomationRule } from "@/lib/erp-core/events/foundation/automation-foundation";

export const ERP_AUTOMATION_GOVERNANCE_VERSION = "erp-automation-governance-p7-3-v1" as const;

export type AutomationGovernanceStatus = "active" | "planned" | "blocked" | "approval_required";

export type AutomationGovernanceEntry = {
  ruleKey: string;
  eventPattern: string;
  actionKey: string;
  status: AutomationGovernanceStatus;
  owner: string;
  departmentScope: string | null;
  sensitivity: "internal" | "restricted";
  runtimeScope: "read_safe" | "approval_required" | "write_forbidden";
  priority: number;
  cooldownMs: number;
};

/** Règles officielles P6 — rule-driven only. */
export const ERP_AUTOMATION_RULES: readonly ErpAutomationRule[] = [
  {
    id: "p6-finance-threshold-exceeded",
    key: "finance.threshold.exceeded.notify_cfo",
    description: "Seuil financier dépassé → trace automation + candidat alerte CFO",
    status: "active",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    departmentScope: "FINANCE",
    actionKey: "automation.finance.threshold_notify",
    owner: "finance",
  },
  {
    id: "p6-approval-request-approved",
    key: "approval.request.approved.post_candidate",
    description: "Approbation accordée → candidat post-approval (read-safe)",
    status: "active",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
    departmentScope: null,
    actionKey: "automation.approval.post_approved_candidate",
    owner: "approval-engine",
  },
  {
    id: "p6-crm-quote-converted",
    key: "crm.quote.converted.sales_candidate",
    description: "Devis converti → candidat automation vente (read-safe)",
    status: "active",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED,
    departmentScope: "VENTE",
    actionKey: "automation.crm.quote_converted_sales",
    owner: "vente-crm",
  },
  {
    id: "p7-hr-contract-expiring-reminder",
    key: "hr.contract.expiring.reminder",
    description: "Contrat échéance → rappel RH (read-safe, bridge P7.2)",
    status: "active",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    departmentScope: "RH",
    actionKey: "automation.hr.contract_expiring_reminder",
    owner: "hr",
  },
  {
    id: "p7-hr-leave-approved-post",
    key: "hr.leave.approved.post",
    description: "Congé approuvé → candidat calendrier RH (read-safe)",
    status: "active",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    departmentScope: "RH",
    actionKey: "automation.hr.leave_approved_post",
    owner: "hr",
  },
] as const;

export const AUTOMATION_GOVERNANCE_MAP: readonly AutomationGovernanceEntry[] = [
  {
    ruleKey: "finance.threshold.exceeded.notify_cfo",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    actionKey: "automation.finance.threshold_notify",
    status: "active",
    owner: "finance",
    departmentScope: "FINANCE",
    sensitivity: "restricted",
    runtimeScope: "read_safe",
    priority: 10,
    cooldownMs: 60_000,
  },
  {
    ruleKey: "approval.request.approved.post_candidate",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
    actionKey: "automation.approval.post_approved_candidate",
    status: "active",
    owner: "approval-engine",
    departmentScope: null,
    sensitivity: "internal",
    runtimeScope: "read_safe",
    priority: 20,
    cooldownMs: 30_000,
  },
  {
    ruleKey: "crm.quote.converted.sales_candidate",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED,
    actionKey: "automation.crm.quote_converted_sales",
    status: "active",
    owner: "vente-crm",
    departmentScope: "VENTE",
    sensitivity: "internal",
    runtimeScope: "read_safe",
    priority: 30,
    cooldownMs: 30_000,
  },
  {
    ruleKey: "finance.journal.auto_post",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    actionKey: "automation.finance.journal_post",
    status: "blocked",
    owner: "finance",
    departmentScope: "FINANCE",
    sensitivity: "restricted",
    runtimeScope: "write_forbidden",
    priority: 0,
    cooldownMs: 0,
  },
  {
    ruleKey: "crm.quote.approved.notify_sales",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
    actionKey: "notify.sales_team",
    status: "planned",
    owner: "vente-crm",
    departmentScope: "VENTE",
    sensitivity: "internal",
    runtimeScope: "read_safe",
    priority: 40,
    cooldownMs: 60_000,
  },
  {
    ruleKey: "hr.contract.expiring.reminder",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    actionKey: "automation.hr.contract_expiring_reminder",
    status: "active",
    owner: "hr",
    departmentScope: "RH",
    sensitivity: "restricted",
    runtimeScope: "read_safe",
    priority: 15,
    cooldownMs: 86_400_000,
  },
  {
    ruleKey: "hr.leave.approved.post",
    eventPattern: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    actionKey: "automation.hr.leave_approved_post",
    status: "active",
    owner: "hr",
    departmentScope: "RH",
    sensitivity: "restricted",
    runtimeScope: "read_safe",
    priority: 25,
    cooldownMs: 60_000,
  },
] as const;

export const ERP_AUTOMATION_GOVERNANCE_SUMMARY = {
  activeRules: ERP_AUTOMATION_RULES.filter((r) => r.status === "active").length,
  freeRulesForbidden: true,
  inProcessOnly: true,
} as const;
