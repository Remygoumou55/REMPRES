/**
 * B3.2+ — Catalogue officiel exploitable (gouvernance, pas runtime métier).
 */

import {
  OFFICIAL_ERP_EVENT_TYPES,
  type OfficialErpEventType,
} from "@/lib/erp-core/events/event-taxonomy";
import type { ErpEventFamily } from "@/lib/erp-core/events/event-contracts";

export const ERP_EVENT_CATALOG_VERSION = "erp-event-catalog-b3.2-plus-v1" as const;

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
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    family: "domain",
    status: "planned",
    owner: "finance",
    publisher: "integrations/finance-events.ts (futur)",
    wiredAt: null,
    notes: "Writes Finance disabled — readiness B3.2+.",
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

export function listEventsByFamily(family: ErpEventFamily): ErpEventCatalogEntry[] {
  return ERP_EVENT_GOVERNANCE_MAP.filter((e) => e.family === family);
}

export function listEventsByStatus(status: ErpEventCatalogStatus): ErpEventCatalogEntry[] {
  return ERP_EVENT_GOVERNANCE_MAP.filter((e) => e.status === status);
}
