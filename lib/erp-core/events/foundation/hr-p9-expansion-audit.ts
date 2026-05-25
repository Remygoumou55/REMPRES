/**
 * P9 — HR_EXPANSION_AUDIT (état POST-P8).
 */

export const HR_P9_EXPANSION_AUDIT_VERSION = "hr-p9-expansion-audit-v1" as const;

export type HrP9AuditFinding = {
  id: string;
  category: "wired" | "retired" | "gap" | "limit";
  area: string;
  finding: string;
  location: string;
};

export const HR_P9_EXPANSION_AUDIT_FINDINGS: readonly HrP9AuditFinding[] = [
  {
    id: "P9-1",
    category: "wired",
    area: "taxonomy",
    finding: "Lifecycle/recruitment + Bloc3 attendance/status/rejected (33 officiels)",
    location: "event-taxonomy.ts",
  },
  {
    id: "P9-2",
    category: "wired",
    area: "contracts",
    finding: "submit/expired/terminated/renewed — bus + bridge",
    location: "hr-contract-lifecycle-mutations.ts",
  },
  {
    id: "P9-3",
    category: "wired",
    area: "recruitment",
    finding: "hire_submitted + employee.created onboarding",
    location: "hr-recruitment-mutations.ts",
  },
  {
    id: "P9-4",
    category: "retired",
    area: "legacy",
    finding: "tryCreateAlert contrats/recrutement remplacé par bridge",
    location: "contract-actions.ts, recruitment-actions.ts",
  },
  {
    id: "P9-5",
    category: "limit",
    area: "attendance",
    finding: "hr.attendance.recorded actif Bloc 3",
    location: "hr-attendance-mutations.ts",
  },
] as const;

export const HR_P9_EXPANSION_AUDIT_SUMMARY = {
  auditVersion: HR_P9_EXPANSION_AUDIT_VERSION,
  catalogVersion: "erp-event-catalog-bloc3-finance-v1",
  officialTypeCount: 38,
  activeHrCatalogEvents: 14,
  legacyTryCreateAlertRetired: 4,
} as const;
