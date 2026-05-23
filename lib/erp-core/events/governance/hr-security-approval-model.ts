/**
 * P7 — HR_SECURITY_APPROVAL_MODEL (matrice gouvernance sécurité).
 */

export const HR_SECURITY_APPROVAL_MODEL_VERSION = "hr-security-approval-p7-v1" as const;

export type HrSecurityClassification = "read" | "approval_ready" | "restricted";

export type HrSecurityApprovalRow = {
  resource: string;
  classification: HrSecurityClassification;
  roles: readonly string[];
  visibility: string;
  approvalReadiness: boolean;
  sensitiveDataBoundary: string;
  busEventAllowed: boolean;
};

export const HR_SECURITY_APPROVAL_MODEL: readonly HrSecurityApprovalRow[] = [
  {
    resource: "profiles / collaborateurs",
    classification: "read",
    roles: ["rh_read", "rh_admin", "super_admin"],
    visibility: "hr_admin + self (manager chain)",
    approvalReadiness: false,
    sensitiveDataBoundary: "Pas de salaire sur bus P7",
    busEventAllowed: true,
  },
  {
    resource: "rh_employee_contracts",
    classification: "approval_ready",
    roles: ["rh_admin", "super_admin"],
    visibility: "hr_admin",
    approvalReadiness: true,
    sensitiveDataBoundary: "Montants rémunération hors payload event",
    busEventAllowed: true,
  },
  {
    resource: "rh_leave_requests",
    classification: "approval_ready",
    roles: ["rh_user", "rh_admin", "super_admin"],
    visibility: "department + approvers",
    approvalReadiness: true,
    sensitiveDataBoundary: "Motif médical optionnel — jamais sur bus",
    busEventAllowed: true,
  },
  {
    resource: "rh_recruitment_candidates",
    classification: "restricted",
    roles: ["rh_admin", "super_admin"],
    visibility: "hr_admin",
    approvalReadiness: true,
    sensitiveDataBoundary: "PII candidat — events hire hors P7 min",
    busEventAllowed: false,
  },
  {
    resource: "payroll",
    classification: "restricted",
    roles: ["super_admin"],
    visibility: "super_admin only",
    approvalReadiness: false,
    sensitiveDataBoundary: "Domaine bloqué P7",
    busEventAllowed: false,
  },
  {
    resource: "approval_requests (rh)",
    classification: "approval_ready",
    roles: ["super_admin"],
    visibility: "governance UI",
    approvalReadiness: true,
    sensitiveDataBoundary: "Décision via decideApprovalRequest + SQL sync contrat/hire",
    busEventAllowed: false,
  },
] as const;

export const HR_SECURITY_APPROVAL_SUMMARY = {
  departmentKeyCanonical: "RH",
  approvalDepartmentKeyDb: "rh",
  mutationGateRequired: true,
  directTryCreateAlertRetireAfter: "P7.2 bridge + P9 wiring",
} as const;
