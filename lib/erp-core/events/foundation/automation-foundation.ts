/**
 * B3.2+ — Fondation automation (design contracts — pas de BPM / workflow builder).
 *
 * Pattern cible :
 *   ErpEvent → AutomationRule (match) → Handler → Execution
 */

import type { ErpEventEnvelope } from "@/lib/erp-core/events/event-contracts";

export const ERP_AUTOMATION_FOUNDATION_VERSION = "erp-automation-foundation-b3.2-plus-v1" as const;

export type ErpAutomationRuleStatus = "draft" | "active" | "disabled";

export type ErpAutomationRule = {
  id: string;
  key: string;
  description: string;
  status: ErpAutomationRuleStatus;
  /** Pattern bus (ex. crm.quote.converted). */
  eventPattern: string;
  departmentScope: string | null;
  /** Condition légère sur payload (clé → valeur attendue). */
  payloadMatch?: Record<string, unknown>;
  actionKey: string;
  owner: string;
};

export type ErpAutomationExecutionContext = {
  rule: ErpAutomationRule;
  event: ErpEventEnvelope;
  triggeredAt: string;
};

export type ErpAutomationHandler = (ctx: ErpAutomationExecutionContext) => Promise<void>;

export type ErpAutomationHandlerRegistration = {
  consumerKey: string;
  actionKey: string;
  handler: ErpAutomationHandler;
};

/** Exemples de règles futures (non exécutées en B3.2+). */
export const ERP_AUTOMATION_RULE_EXAMPLES: readonly ErpAutomationRule[] = [
  {
    id: "example-quote-approved-chain",
    key: "crm.quote.approved.notify_sales",
    description: "Devis approuvé → notifier équipe vente",
    status: "draft",
    eventPattern: "approval.request.approved",
    departmentScope: "VENTE",
    payloadMatch: { mutationAction: "crm.quote.convert_sale" },
    actionKey: "notify.sales_team",
    owner: "vente-crm",
  },
  {
    id: "example-finance-threshold",
    key: "finance.threshold.alert_cfo",
    description: "Seuil trésorerie → alerte CFO",
    status: "draft",
    eventPattern: "finance.transaction.recorded",
    departmentScope: "FINANCE",
    actionKey: "alert.cfo_threshold",
    owner: "finance",
  },
  {
    id: "example-hr-contract-expiry",
    key: "rh.contract.expiry.reminder",
    description: "Contrat proche échéance → rappel RH",
    status: "draft",
    eventPattern: "rh.contract.expiring",
    departmentScope: "RH",
    actionKey: "reminder.hr_contract",
    owner: "rh",
  },
] as const;
