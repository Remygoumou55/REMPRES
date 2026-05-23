/**
 * P7 — Amendement catalogue officiel HR (taxonomie + gouvernance).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const HR_EVENT_GOVERNANCE_AMENDMENT_VERSION = "hr-event-governance-p7-v1" as const;

export type HrEventGovernancePriority = "normal" | "high" | "critical";

export type HrGovernanceAmendmentEntry = {
  type: string;
  family: "domain";
  sensitivity: "restricted";
  owner: "hr";
  departmentKey: "RH";
  priority: HrEventGovernancePriority;
  correlationDefault: string;
  status: "catalog_only";
  collisionCheck: "unique_in_catalog";
};

/** HR EVENT GOVERNANCE MAP — six types minimum P7. */
export const HR_EVENT_GOVERNANCE_AMENDMENT: readonly HrGovernanceAmendmentEntry[] = [
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED,
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    departmentKey: "RH",
    priority: "normal",
    correlationDefault: "employeeId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_UPDATED,
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    departmentKey: "RH",
    priority: "normal",
    correlationDefault: "employeeId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_CREATED,
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    departmentKey: "RH",
    priority: "normal",
    correlationDefault: "contractId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    departmentKey: "RH",
    priority: "high",
    correlationDefault: "contractId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    departmentKey: "RH",
    priority: "normal",
    correlationDefault: "leaveId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
  {
    type: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    family: "domain",
    sensitivity: "restricted",
    owner: "hr",
    departmentKey: "RH",
    priority: "normal",
    correlationDefault: "leaveId",
    status: "catalog_only",
    collisionCheck: "unique_in_catalog",
  },
] as const;

export const HR_EVENT_GOVERNANCE_AMENDMENT_SUMMARY = {
  amendmentVersion: HR_EVENT_GOVERNANCE_AMENDMENT_VERSION,
  officialHrTypeCount: HR_EVENT_GOVERNANCE_AMENDMENT.length,
  namingLock: "domain.entity.action",
  duplicatesForbidden: true,
  mutationsWired: false,
  integrationFile: "lib/erp-core/events/integrations/hr-events.ts",
} as const;
