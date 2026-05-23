/**
 * P7 — HR CURRENT STATE AUDIT (état réel codebase POST-P6.1).
 */

export const HR_CURRENT_STATE_AUDIT_VERSION = "hr-current-state-audit-p7-v1" as const;

export type HrAuditFinding = {
  id: string;
  category: "exists" | "placeholder" | "debt" | "dependency" | "readiness";
  severity: "info" | "warning" | "blocker";
  finding: string;
  path: string;
  p7Impact: string;
};

export const HR_CURRENT_STATE_AUDIT_FINDINGS: readonly HrAuditFinding[] = [
  {
    id: "A1",
    category: "exists",
    severity: "info",
    finding: "Domaine RH opérationnel (employees, contracts, recruitment)",
    path: "modules/hr/{employees,contracts,recruitment}",
    p7Impact: "SoT et UI prêts — bus absent",
  },
  {
    id: "A2",
    category: "exists",
    severity: "info",
    finding: "Congés et présences app-local",
    path: "app/(app)/rh/{conges,presences}/actions.ts",
    p7Impact: "Cibles wiring leave.* events P7.1",
  },
  {
    id: "A3",
    category: "debt",
    severity: "warning",
    finding: "tryCreateAlert legacy (contrats + recrutement)",
    path: "modules/hr/contracts/server/actions/contract-actions.ts",
    p7Impact: "Coexistence — retrait après bridge P7.2",
  },
  {
    id: "A4",
    category: "debt",
    severity: "warning",
    finding: "Pas de publishErpEvent dans modules/hr",
    path: "modules/hr/**",
    p7Impact: "P7 ajoute publishers ; P7.1 câble mutations",
  },
  {
    id: "A5",
    category: "debt",
    severity: "warning",
    finding: "Pas de mutation-gate B3 sur HR",
    path: "modules/hr/**",
    p7Impact: "hr-write-governance registry P7 — enable P7.1",
  },
  {
    id: "A6",
    category: "dependency",
    severity: "info",
    finding: "Approvals SQL sync contrat/hire",
    path: "supabase/sql/044_*, 045_*",
    p7Impact: "Events distincts de approval.* — pas de doublon",
  },
  {
    id: "A7",
    category: "dependency",
    severity: "info",
    finding: "Infrastructure bus + notification + automation mature",
    path: "lib/erp-core/events/",
    p7Impact: "Extension taxonomy — pas de rebuild",
  },
  {
    id: "A8",
    category: "placeholder",
    severity: "info",
    finding: "HR visual placeholders",
    path: "modules/department-dashboards/hr/visual/",
    p7Impact: "Hors scope P7",
  },
  {
    id: "A9",
    category: "debt",
    severity: "warning",
    finding: "Clés département RH vs rh (dual)",
    path: "lib/server/rh-foundation.ts",
    p7Impact: "HR_DEPARTMENT_KEY=RH bus ; rh approvals DB",
  },
  {
    id: "A10",
    category: "readiness",
    severity: "info",
    finding: "Draft automation rh.contract.expiring",
    path: "lib/erp-core/events/foundation/automation-foundation.ts",
    p7Impact: "Aligner sur hr.contract.expiring P7.3",
  },
] as const;

export const HR_CURRENT_STATE_AUDIT_SUMMARY = {
  auditVersion: HR_CURRENT_STATE_AUDIT_VERSION,
  hrDomainOnBusBeforeP7: false,
  operationalModules: 3,
  legacyAlertMechanisms: 2,
  foundationGap: "taxonomy + publishers + governance maps",
  expectedArchitecture: "runtime → approval → event → notification → automation",
} as const;
