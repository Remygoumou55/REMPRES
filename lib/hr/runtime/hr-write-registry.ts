/**
 * P7.1 / P9 — Registre mutations RH (sans dépendance approval/permissions — safe tests).
 */

import { HR_DEPARTMENT_KEY } from "@/lib/hr/governance/hr-domain-governance";

export const HR_WRITE_ACTIONS = {
  EMPLOYEE_ROLE_UPDATE: "hr.employee.role_update",
  EMPLOYEE_MANAGER_UPDATE: "hr.employee.manager_update",
  CONTRACT_CREATE: "hr.contract.create",
  CONTRACT_SUBMIT_APPROVAL: "hr.contract.submit_approval",
  CONTRACT_STATUS_UPDATE: "hr.contract.status_update",
  CONTRACT_RENEW: "hr.contract.renew",
  LEAVE_REQUEST: "hr.leave.request",
  LEAVE_STATUS_UPDATE: "hr.leave.status_update",
  RECRUITMENT_HIRE_SUBMIT: "hr.recruitment.hire_submit",
  RECRUITMENT_DOMAIN_LINK: "hr.recruitment.domain_link",
  ATTENDANCE_RECORD: "hr.attendance.record",
  EMPLOYEE_STATUS_UPDATE: "hr.employee.status_update",
} as const;

export type HrWriteAction = (typeof HR_WRITE_ACTIONS)[keyof typeof HR_WRITE_ACTIONS];

export const HR_WRITE_ACTION_REGISTRY: Record<
  HrWriteAction,
  { enabled: boolean; requiresApproval: boolean; description: string; eventType: string | null }
> = {
  [HR_WRITE_ACTIONS.EMPLOYEE_ROLE_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Mise à jour rôle collaborateur — P7.1 bus",
    eventType: "hr.employee.updated",
  },
  [HR_WRITE_ACTIONS.EMPLOYEE_MANAGER_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Mise à jour manager — P7.1 bus",
    eventType: "hr.employee.updated",
  },
  [HR_WRITE_ACTIONS.CONTRACT_CREATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Création contrat brouillon — P7.1 bus",
    eventType: "hr.contract.created",
  },
  [HR_WRITE_ACTIONS.CONTRACT_SUBMIT_APPROVAL]: {
    enabled: true,
    requiresApproval: false,
    description: "Soumission activation contrat — P9 bus",
    eventType: "hr.contract.submitted",
  },
  [HR_WRITE_ACTIONS.CONTRACT_STATUS_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Transition statut contrat (expired/terminated) — P9",
    eventType: null,
  },
  [HR_WRITE_ACTIONS.CONTRACT_RENEW]: {
    enabled: true,
    requiresApproval: false,
    description: "Renouvellement contrat — P9 bus",
    eventType: "hr.contract.renewed",
  },
  [HR_WRITE_ACTIONS.LEAVE_REQUEST]: {
    enabled: true,
    requiresApproval: false,
    description: "Demande congé — approval créée post-insert (P7.1)",
    eventType: "hr.leave.requested",
  },
  [HR_WRITE_ACTIONS.LEAVE_STATUS_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Transition statut congé — emit approved si approved",
    eventType: "hr.leave.approved",
  },
  [HR_WRITE_ACTIONS.RECRUITMENT_HIRE_SUBMIT]: {
    enabled: true,
    requiresApproval: false,
    description: "Embauche soumise pour validation — P9 bus",
    eventType: "hr.recruitment.hire_submitted",
  },
  [HR_WRITE_ACTIONS.RECRUITMENT_DOMAIN_LINK]: {
    enabled: true,
    requiresApproval: false,
    description: "Rattachement candidat embauché au domaine employé — P9",
    eventType: "hr.employee.created",
  },
  [HR_WRITE_ACTIONS.ATTENDANCE_RECORD]: {
    enabled: true,
    requiresApproval: false,
    description: "Pointage présence — Bloc 3 bus",
    eventType: "hr.attendance.recorded",
  },
  [HR_WRITE_ACTIONS.EMPLOYEE_STATUS_UPDATE]: {
    enabled: true,
    requiresApproval: false,
    description: "Activation / désactivation collaborateur — Bloc 3",
    eventType: "hr.employee.status_changed",
  },
};

export const HR_WRITE_GOVERNANCE_SUMMARY = {
  departmentKey: HR_DEPARTMENT_KEY,
  enabledCount: Object.values(HR_WRITE_ACTION_REGISTRY).filter((r) => r.enabled).length,
  totalActions: Object.keys(HR_WRITE_ACTION_REGISTRY).length,
  activationPhase: "P9",
} as const;
