/**
 * P4 — Amendement catalogue officiel Finance (taxonomie + gouvernance).
 * Pas d'activation writes — catalogue et métadonnées uniquement.
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const FINANCE_EVENT_GOVERNANCE_AMENDMENT_VERSION = "finance-event-governance-p4-v1" as const;

export type FinanceGovernanceAmendmentEntry = {
  type: string;
  family: "domain";
  sensitivity: "restricted";
  owner: "finance";
  departmentKey: "FINANCE";
  correlationDefault: string;
  status: "catalog_only";
  collisionCheck: "unique_in_catalog";
};

/** Quatre slots officiels Finance minimum P4. */
export const FINANCE_EVENT_GOVERNANCE_AMENDMENT: readonly FinanceGovernanceAmendmentEntry[] = [
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    departmentKey: "FINANCE",
    correlationDefault: "transactionId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_FAILED,
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    departmentKey: "FINANCE",
    correlationDefault: "transactionId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    departmentKey: "FINANCE",
    correlationDefault: "thresholdKey",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.FINANCE_PAYMENT_RECORDED,
    family: "domain",
    sensitivity: "restricted",
    owner: "finance",
    departmentKey: "FINANCE",
    correlationDefault: "paymentId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
] as const;

export const FINANCE_EVENT_GOVERNANCE_AMENDMENT_SUMMARY = {
  amendmentVersion: FINANCE_EVENT_GOVERNANCE_AMENDMENT_VERSION,
  officialFinanceTypeCount: FINANCE_EVENT_GOVERNANCE_AMENDMENT.length,
  namingLock: "domain.entity.action",
  duplicatesForbidden: true,
  writesEnabled: false,
  integrationFile: "lib/erp-core/events/integrations/finance-events.ts",
} as const;
