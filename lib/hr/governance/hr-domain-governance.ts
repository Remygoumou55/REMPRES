/**
 * P7 — Gouvernance domaine RH (catalogue métier, pas runtime complet).
 */

export const HR_DOMAIN_GOVERNANCE_VERSION = "hr-domain-governance-p9-v1" as const;

/** Clé département canonique bus / RBAC (aligné FINANCE). */
export const HR_DEPARTMENT_KEY = "RH" as const;

/** Clé approvals / alerts legacy (lowercase DB). */
export const HR_APPROVAL_DEPARTMENT_KEY = "rh" as const;

export type HrGovernanceCapabilityStatus =
  | "active"
  | "planned"
  | "blocked"
  | "approval_ready";

export type HrGovernanceCapability = {
  id: string;
  label: string;
  status: HrGovernanceCapabilityStatus;
  owner: string;
  security: "internal" | "restricted" | "confidential";
  visibility: "department" | "hr_admin" | "super_admin";
  runtimeScope: "read" | "write_governed" | "approval_sync";
  modulePath: string | null;
  notes: string;
};

/** HR_DOMAIN_GOVERNANCE — périmètre officiel P7. */
export const HR_DOMAIN_GOVERNANCE = {
  version: HR_DOMAIN_GOVERNANCE_VERSION,
  departmentKey: HR_DEPARTMENT_KEY,
  approvalDepartmentKey: HR_APPROVAL_DEPARTMENT_KEY,
  namespace: "lib/hr",
  eventOwner: "hr",
  namingLock: "domain.entity.action",
  payrollInScope: false,
  atsFullInScope: false,
  parallelBusForbidden: true,
} as const;

/** HR_GOVERNANCE_MAP — capacités métier classées. */
export const HR_GOVERNANCE_MAP: readonly HrGovernanceCapability[] = [
  {
    id: "employee_registry",
    label: "Registre collaborateurs (profiles SoT)",
    status: "active",
    owner: "modules/hr/employees",
    security: "restricted",
    visibility: "hr_admin",
    runtimeScope: "read",
    modulePath: "modules/hr/employees",
    notes: "Lecture active ; writes events = P7.1.",
  },
  {
    id: "contract_visibility",
    label: "Contrats RH — visibilité & workflows",
    status: "active",
    owner: "modules/hr/contracts",
    security: "restricted",
    visibility: "hr_admin",
    runtimeScope: "approval_sync",
    modulePath: "modules/hr/contracts",
    notes: "Activation via SQL trigger approval ; bus catalog_only P7.",
  },
  {
    id: "recruitment_pipeline",
    label: "Recrutement ATS-lite",
    status: "active",
    owner: "modules/hr/recruitment",
    security: "restricted",
    visibility: "hr_admin",
    runtimeScope: "approval_sync",
    modulePath: "modules/hr/recruitment",
    notes: "Hire approval SQL ; pas d'events hire P7 (hors taxonomie min).",
  },
  {
    id: "leave_visibility",
    label: "Congés — demandes & statuts",
    status: "approval_ready",
    owner: "app/(app)/rh/actions",
    security: "restricted",
    visibility: "department",
    runtimeScope: "write_governed",
    modulePath: "app/(app)/rh/conges",
    notes: "rh_leave_requests ; gate B3 = P7.1.",
  },
  {
    id: "attendance_visibility",
    label: "Présences — saisie événements",
    status: "planned",
    owner: "app/(app)/rh/presences",
    security: "internal",
    visibility: "department",
    runtimeScope: "read",
    modulePath: "app/(app)/rh/presences",
    notes: "Hors taxonomie P7 ; event hr.attendance.* = P9+.",
  },
  {
    id: "payroll_engine",
    label: "Paie complète",
    status: "blocked",
    owner: "governance",
    security: "confidential",
    visibility: "super_admin",
    runtimeScope: "read",
    modulePath: null,
    notes: "Interdit P7 — domaine futur isolé.",
  },
  {
    id: "hr_event_bus",
    label: "HR Event Foundation (bus ERP)",
    status: "active",
    owner: "lib/erp-core/events/integrations/hr-events.ts",
    security: "restricted",
    visibility: "hr_admin",
    runtimeScope: "write_governed",
    modulePath: "lib/erp-core/events",
    notes: "P9 — 11 events actifs catalogue ; lifecycle + recrutement.",
  },
  {
    id: "hr_notification_bridge",
    label: "Notification bridge RH",
    status: "active",
    owner: "handlers/notification-hr-bridge",
    security: "restricted",
    visibility: "department",
    runtimeScope: "read",
    modulePath: null,
    notes: "Readiness P7 — activation P7.2 (miroir finance P5).",
  },
  {
    id: "hr_automation_rules",
    label: "Automation RH (read-safe)",
    status: "active",
    owner: "automation-engine",
    security: "internal",
    visibility: "hr_admin",
    runtimeScope: "read",
    modulePath: "lib/erp-core/events/automation",
    notes: "Candidats P7 — règles actives P7.3+.",
  },
] as const;

export function listHrCapabilitiesByStatus(
  status: HrGovernanceCapabilityStatus,
): HrGovernanceCapability[] {
  return HR_GOVERNANCE_MAP.filter((c) => c.status === status);
}
