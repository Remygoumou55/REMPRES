/**
 * P9 — HR_EXPANSION_READINESS_REPORT.
 */

import { ERP_EVENT_CATALOG_VERSION } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { listHrGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { HR_P9_EXPANSION_AUDIT_SUMMARY } from "@/lib/erp-core/events/foundation/hr-p9-expansion-audit";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { HR_WRITE_ACTION_REGISTRY } from "@/lib/hr/runtime/hr-write-registry";

export const HR_P9_READINESS_VALIDATION_VERSION = "hr-p9-readiness-v1" as const;

export type HrP9ReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  notes: string;
};

const activeHr = () => listHrGovernanceEvents().filter((e) => e.status === "active");

export const HR_P9_READINESS_CHECKS: readonly HrP9ReadinessCheck[] = [
  {
    id: "P9-R1",
    label: "Catalogue P9",
    passed: ERP_EVENT_CATALOG_VERSION === "erp-event-catalog-bloc3-finance-v1",
    notes: "38 types officiels (Bloc 3 Finance)",
  },
  {
    id: "P9-R2",
    label: "hr.employee.created actif",
    passed: activeHr().some((e) => e.type === OFFICIAL_ERP_EVENT_TYPES.HR_EMPLOYEE_CREATED),
    notes: "onboarding hire",
  },
  {
    id: "P9-R3",
    label: "Lifecycle contrats bus",
    passed: activeHr().some((e) => e.type === OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_SUBMITTED),
    notes: "submitted + expired + terminated + renewed",
  },
  {
    id: "P9-R4",
    label: "Recrutement hire_submitted",
    passed: activeHr().some((e) => e.type === OFFICIAL_ERP_EVENT_TYPES.HR_RECRUITMENT_HIRE_SUBMITTED),
    notes: "hr.recruitment.hire_submitted",
  },
  {
    id: "P9-R5",
    label: "Write registry P9",
    passed: Object.values(HR_WRITE_ACTION_REGISTRY).filter((r) => r.enabled).length >= 9,
    notes: "10 actions enabled",
  },
  {
    id: "P9-R6",
    label: "Audit P9",
    passed: HR_P9_EXPANSION_AUDIT_SUMMARY.officialTypeCount === 38,
    notes: HR_P9_EXPANSION_AUDIT_SUMMARY.catalogVersion,
  },
];

export const HR_P9_READINESS_VERDICT = {
  overall: HR_P9_READINESS_CHECKS.every((c) => c.passed) ? ("READY" as const) : ("NOT READY" as const),
  blockers: [] as readonly string[],
  nextPhases: ["P10 autres domaines", "P11 observability avancée"],
} as const;
