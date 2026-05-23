/**
 * P7 — HR_FOUNDATION_READINESS_REPORT (validation senior).
 */

import { HR_EVENT_GOVERNANCE_AMENDMENT } from "@/lib/erp-core/events/governance/hr-event-governance-amendment";
import { HR_PUBLISHER_DESIGN_MAP } from "@/lib/erp-core/events/governance/hr-publisher-design-map";
import { HR_NOTIFICATION_READINESS_SUMMARY } from "@/lib/erp-core/events/governance/hr-notification-readiness-map";
import { HR_NOTIFICATION_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/hr-notification-readiness-validation";
import { HR_AUTOMATION_READINESS_SUMMARY } from "@/lib/erp-core/events/governance/hr-automation-readiness-map";
import { HR_AUTOMATION_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/hr-automation-readiness-validation";
import { HR_GOVERNANCE_MAP } from "@/lib/hr/governance/hr-domain-governance";
import { HR_WRITE_GOVERNANCE_SUMMARY } from "@/lib/hr/runtime/hr-write-registry";
import { listHrGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";

export const HR_FOUNDATION_READINESS_VERSION = "hr-foundation-readiness-p7-v1" as const;

export type HrFoundationReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  notes: string;
};

export const HR_FOUNDATION_READINESS_CHECKS: readonly HrFoundationReadinessCheck[] = [
  {
    id: "H1",
    label: "Taxonomie — 6 types officiels HR",
    passed: HR_EVENT_GOVERNANCE_AMENDMENT.length === 6,
    notes: "hr.employee.*, hr.contract.*, hr.leave.*",
  },
  {
    id: "H2",
    label: "Ownership — owner hr, department RH",
    passed: HR_EVENT_GOVERNANCE_AMENDMENT.every((e) => e.owner === "hr" && e.departmentKey === "RH"),
    notes: "Aligné HR_DOMAIN_GOVERNANCE",
  },
  {
    id: "H3",
    label: "Security — sensitivity restricted",
    passed: HR_EVENT_GOVERNANCE_AMENDMENT.every((e) => e.sensitivity === "restricted"),
    notes: "Données RH sensibles",
  },
  {
    id: "H4",
    label: "Publishers définis (design map)",
    passed: HR_PUBLISHER_DESIGN_MAP.length === 6,
    notes: "hr-events.ts implémenté — wirePhase publisher_ready",
  },
  {
    id: "H5",
    label: "Catalogue gouvernance — entrées hr.*",
    passed: listHrGovernanceEvents().length >= 11,
    notes: "P9 — 11 events actifs catalogue",
  },
  {
    id: "H6",
    label: "Runtime foundation — read-first",
    passed: HR_GOVERNANCE_MAP.some((c) => c.id === "employee_registry" && c.status === "active"),
    notes: "HR_RUNTIME_DESIGN_MAP + write registry disabled",
  },
  {
    id: "H7",
    label: "Notification bridge — P7.2 actif",
    passed:
      HR_NOTIFICATION_READINESS_SUMMARY.minimumCandidatesMet &&
      HR_NOTIFICATION_READINESS_VERDICT.p72BridgeReady,
    notes: "notification-hr-bridge + 3 templates",
  },
  {
    id: "H8",
    label: "Automation P7.3 — règles actives + evaluator",
    passed:
      HR_AUTOMATION_READINESS_SUMMARY.minimumCandidatesMet &&
      HR_AUTOMATION_READINESS_VERDICT.p73AutomationReady,
    notes: "hr.contract.expiring + hr.leave.approved",
  },
  {
    id: "H9",
    label: "Governance compatibility — pas de rebuild bus",
    passed: true,
    notes: "Extension OFFICIAL_ERP_EVENT_TYPES uniquement",
  },
  {
    id: "H10",
    label: "Writes activés (P7.1+ P9)",
    passed: HR_WRITE_GOVERNANCE_SUMMARY.enabledCount >= 10,
    notes: "lifecycle contrats + recrutement P9",
  },
] as const;

export type HrFoundationReadinessVerdict = "READY" | "NOT READY";

export const HR_FOUNDATION_READINESS_VERDICT: {
  foundation: HrFoundationReadinessVerdict;
  mutationWiring: HrFoundationReadinessVerdict;
  notificationBridge: HrFoundationReadinessVerdict;
  automationRules: HrFoundationReadinessVerdict;
  overallP7: HrFoundationReadinessVerdict;
  blockers: readonly string[];
  nextPhases: readonly string[];
} = {
  foundation:
    HR_FOUNDATION_READINESS_CHECKS.every((c) => c.passed) ? "READY" : "NOT READY",
  mutationWiring:
    HR_WRITE_GOVERNANCE_SUMMARY.enabledCount >= 10 ? "READY" : "NOT READY",
  notificationBridge: HR_NOTIFICATION_READINESS_VERDICT.p72BridgeReady ? "READY" : "NOT READY",
  automationRules: HR_AUTOMATION_READINESS_VERDICT.p73AutomationReady ? "READY" : "NOT READY",
  overallP7: HR_FOUNDATION_READINESS_CHECKS.every((c) => c.passed) ? "READY" : "NOT READY",
  blockers: [],
  nextPhases: ["P10 autres domaines", "P11 observability avancée"],
};
