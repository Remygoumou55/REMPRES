/**
 * B3.2+ — Catalogue officiel exploitable (gouvernance, pas runtime métier).
 */

import {
  OFFICIAL_ERP_EVENT_TYPES,
  type OfficialErpEventType,
} from "@/lib/erp-core/events/event-taxonomy";
import type { ErpEventFamily } from "@/lib/erp-core/events/event-contracts";

export const ERP_EVENT_CATALOG_VERSION = "erp-event-catalog-p9-v1" as const;

export type ErpEventCatalogStatus =
  | "active"
  | "partial"
  | "catalog_only"
  | "planned";

export type ErpEventCatalogEntry = {
  type: OfficialErpEventType;
  family: ErpEventFamily;
  status: ErpEventCatalogStatus;
  owner: string;
  publisher: string | null;
  wiredAt: string | null;
  notes: string;
};

/** Cartographie officielle — statut d'exploitation au runtime. */
export const ERP_EVENT_GOVERNANCE_MAP: readonly ErpEventCatalogEntry[] = [
  {
    type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_CREATED,
    family: "approval",
    status: "active",
    owner: "approval-engine",
    publisher: "integrations/approval-events.ts",
    wiredAt: "lib/erp-core/approval/mutation-gate.ts",
    notes: "Émis à la création d'une demande pending.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_APPROVED,
    family: "approval",
    status: "active",
    owner: "approval-engine",
    publisher: "integrations/approval-events.ts",
    wiredAt: "app/(app)/admin/approvals/actions.ts",
    notes: "Post decideApprovalRequest approved.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_REQUEST_REJECTED,
    family: "approval",
    status: "active",
    owner: "approval-engine",
    publisher: "integrations/approval-events.ts",
    wiredAt: "app/(app)/admin/approvals/actions.ts",
    notes: "Post decideApprovalRequest rejected.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.APPROVAL_GATE_GRANTED,
    family: "approval",
    status: "active",
    owner: "approval-engine",
    publisher: "integrations/approval-events.ts",
    wiredAt: "lib/erp-core/approval/mutation-gate.ts",
    notes: "Demande déjà approved — mutation autorisée.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.MUTATION_BLOCKED_PENDING,
    family: "mutation",
    status: "active",
    owner: "mutation-gate",
    publisher: "integrations/approval-events.ts",
    wiredAt: "lib/erp-core/approval/mutation-gate.ts",
    notes: "Tentative mutation alors que pending.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERTED,
    family: "domain",
    status: "active",
    owner: "vente-crm",
    publisher: "integrations/crm-events.ts",
    wiredAt: "modules/crm/server/services/quote-sale-conversion.ts",
    notes: "Post-RPC convert_crm_quote_to_sale.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CONVERT_REQUESTED,
    family: "mutation",
    status: "active",
    owner: "vente-crm",
    publisher: "integrations/crm-events.ts",
    wiredAt: "modules/crm/server/services/quote-sale-conversion.ts",
    notes: "Émis pré-gate (intention conversion).",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_COMPLETED,
    family: "runtime",
    status: "active",
    owner: "runtime",
    publisher: "integrations/crm-events.ts",
    wiredAt: "emitCrmQuoteConverted",
    notes: "Émis avec convert quote.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.RUNTIME_ORCHESTRATION_FAILED,
    family: "runtime",
    status: "active",
    owner: "runtime",
    publisher: "integrations/crm-events.ts",
    wiredAt: "modules/crm/server/services/quote-sale-conversion.ts",
    notes: "Échec RPC, payload invalide ou assert orchestration.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED,
    family: "domain",
    status: "active",
    owner: "vente-crm",
    publisher: "integrations/crm-events.ts",
    wiredAt: "modules/crm/server/services/crm-mutations.ts#createCrmLead",
    notes: "P1.1 — post-insert, avant audit legacy.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CREATED,
    family: "domain",
    status: "active",
    owner: "vente-crm",
    publisher: "integrations/crm-events.ts",
    wiredAt: "modules/crm/server/services/crm-mutations.ts#createCrmQuote",
    notes: "P1.1 — post-insert, avant audit legacy.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_STATUS_UPDATED,
    family: "domain",
    status: "active",
    owner: "vente-crm",
    publisher: "integrations/crm-events.ts",
    wiredAt: "modules/crm/server/services/crm-mutations.ts#updateCrmQuoteStatus",
    notes: "P1.1 — post-update, avant audit legacy.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    family: "domain",
    status: "catalog_only",
    owner: "finance",
    publisher: "integrations/finance-events.ts",
    wiredAt: null,
    notes: "P4 — journal post / FT SoT ; activation write P4.1.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED,
    family: "domain",
    status: "catalog_only",
    owner: "finance",
    publisher: "integrations/finance-events.ts",
    wiredAt: null,
    notes: "P4 — échec RPC journal / FT ; pas d'émission avant gate activé.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    family: "domain",
    status: "active",
    owner: "finance",
    publisher: "integrations/finance-events.ts",
    wiredAt: "lib/finance/runtime/finance-threshold-evaluator.ts#evaluateAndEmitFinanceTreasuryThresholds",
    notes: "P6.1 — KPI trésorerie → bus ; bridge P5 + automation P6.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED,
    family: "domain",
    status: "catalog_only",
    owner: "finance",
    publisher: "integrations/finance-events.ts",
    wiredAt: null,
    notes: "P4 — paiement enregistré ; distinct de payment.allocate registry.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_CREATED,
    family: "domain",
    status: "active",
    owner: "finance",
    publisher: "integrations/finance-events.ts",
    wiredAt: "modules/finance/server/services/finance-expense-mutations.ts#createFinanceExpense",
    notes: "P4.1 — post-RPC, parallèle audit governance.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_EXPENSE_UPDATED,
    family: "domain",
    status: "active",
    owner: "finance",
    publisher: "integrations/finance-events.ts",
    wiredAt: "modules/finance/server/services/finance-expense-mutations.ts#updateFinanceExpense",
    notes: "P4.1 — post-RPC, parallèle audit governance.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-recruitment-mutations.ts#linkHrCandidateToEmployeeDomain",
    notes: "P9 — onboarding embauche (rattachement profil).",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-employee-mutations.ts",
    notes: "P7.1 — role/manager update post-write.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-contract-mutations.ts#createHrContract",
    notes: "P7.1 — brouillon contrat ; activation = approval SQL.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_SUBMITTED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-contract-lifecycle-mutations.ts#submitHrContractForApproval",
    notes: "P9 — soumission approbation ; remplace tryCreateAlert pending.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "lib/hr/runtime/hr-contract-expiry-evaluator.ts#evaluateAndEmitHrContractExpiringEvents",
    notes: "P7.3 — snapshot contrats + transition renewal_due ; bridge + automation.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-contract-lifecycle-mutations.ts#transitionHrContractStatus",
    notes: "P9 — cycle de vie contrat expiré.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_TERMINATED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-contract-lifecycle-mutations.ts#transitionHrContractStatus",
    notes: "P9 — cycle de vie contrat terminé.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_RENEWED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-contract-lifecycle-mutations.ts#renewHrContract",
    notes: "P9 — renouvellement date fin ; remplace tryCreateAlert renewed.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_RECRUITMENT_HIRE_SUBMITTED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-recruitment-mutations.ts#submitHrRecruitmentHire",
    notes: "P9 — embauche soumise approbation ; remplace tryCreateAlert hire_pending.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-leave-mutations.ts#submitHrLeaveRequest",
    notes: "P7.1 — post-insert + approval row.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    family: "domain",
    status: "active",
    owner: "hr",
    publisher: "integrations/hr-events.ts",
    wiredAt: "modules/hr/server/services/hr-leave-mutations.ts#updateHrLeaveStatus",
    notes: "P7.1 — émis si status approved uniquement.",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.SYSTEM_AUDIT_RECORDED,
    family: "audit",
    status: "planned",
    owner: "governance",
    publisher: null,
    wiredAt: null,
    notes: "Pont audit legacy → bus (phase ultérieure).",
  },
] as const;

export function listCrmGovernanceEvents(): ErpEventCatalogEntry[] {
  return ERP_EVENT_GOVERNANCE_MAP.filter((e) => e.type.startsWith("crm."));
}

export function listFinanceGovernanceEvents(): ErpEventCatalogEntry[] {
  return ERP_EVENT_GOVERNANCE_MAP.filter((e) => e.type.startsWith("finance."));
}

export function listHrGovernanceEvents(): ErpEventCatalogEntry[] {
  return ERP_EVENT_GOVERNANCE_MAP.filter((e) => e.type.startsWith("hr."));
}

export function listEventsByFamily(family: ErpEventFamily): ErpEventCatalogEntry[] {
  return ERP_EVENT_GOVERNANCE_MAP.filter((e) => e.family === family);
}

export function listEventsByStatus(status: ErpEventCatalogStatus): ErpEventCatalogEntry[] {
  return ERP_EVENT_GOVERNANCE_MAP.filter((e) => e.status === status);
}
