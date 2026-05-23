/**
 * P7 — HR_AUTOMATION_READINESS_MAP (compatibilité P6, read-safe uniquement).
 */

import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const HR_AUTOMATION_READINESS_MAP_VERSION = "hr-automation-readiness-p7-3-v1" as const;

export type HrAutomationReadinessRow = {
  eventType: string;
  ruleId: string;
  candidate: boolean;
  actionType: "trace" | "reminder_candidate" | "post_approval_candidate";
  departmentScope: "RH";
  description: string;
  writeAutoForbidden: true;
  activationPhase: string;
};

export const HR_AUTOMATION_READINESS_MAP: readonly HrAutomationReadinessRow[] = [
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_CONTRACT_EXPIRING,
    ruleId: "hr-contract-expiring-reminder",
    candidate: true,
    actionType: "reminder_candidate",
    departmentScope: "RH",
    description: "Rappel échéance contrat — trace + notification bridge (pas write auto)",
    writeAutoForbidden: true,
    activationPhase: "active",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_APPROVED,
    ruleId: "hr-leave-approved-post",
    candidate: true,
    actionType: "post_approval_candidate",
    departmentScope: "RH",
    description: "Post-approbation congé — trace calendrier RH (read-safe)",
    writeAutoForbidden: true,
    activationPhase: "active",
  },
  {
    eventType: OFFICIAL_ERP_EVENT_TYPES.HR_LEAVE_REQUESTED,
    ruleId: "hr-leave-requested-trace",
    candidate: false,
    actionType: "trace",
    departmentScope: "RH",
    description: "Trace uniquement — notification bridge prioritaire",
    writeAutoForbidden: true,
    activationPhase: "P7.3",
  },
] as const;

export const HR_AUTOMATION_READINESS_SUMMARY = {
  payrollAutoForbidden: true,
  minimumCandidatesMet: HR_AUTOMATION_READINESS_MAP.filter((r) => r.candidate).length >= 2,
  activeRuleCount: 2,
  engineReuse: "automation-engine-handler (pattern *)",
  evaluator: "lib/hr/runtime/hr-contract-expiry-evaluator.ts",
} as const;
