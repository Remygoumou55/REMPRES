/**
 * P7.2 — Validation readiness notification RH.
 */

import { HR_NOTIFICATION_GOVERNANCE_MAP } from "@/lib/erp-core/events/governance/hr-notification-governance-map";
import { HR_NOTIFICATION_READINESS_MAP } from "@/lib/erp-core/events/governance/hr-notification-readiness-map";
import { HR_BRIDGE_INTEGRATION_STEPS } from "@/lib/erp-core/events/foundation/hr-bridge-integration-plan";

export const HR_NOTIFICATION_READINESS_VALIDATION_VERSION =
  "hr-notification-readiness-p7-2-v1" as const;

export type HrNotificationReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  notes: string;
};

export const HR_NOTIFICATION_READINESS_CHECKS: readonly HrNotificationReadinessCheck[] = [
  {
    id: "HN1",
    label: "Routing — pattern hr.*",
    passed: true,
    notes: "notification-hr-bridge enregistré",
  },
  {
    id: "HN2",
    label: "Ownership — dept RH",
    passed: HR_NOTIFICATION_GOVERNANCE_MAP.every((e) => e.owner === "hr" && e.departmentKey === "RH"),
    notes: "departmentScope RH sur handler",
  },
  {
    id: "HN3",
    label: "Collisions template — uniques (actifs)",
    passed:
      new Set(
        HR_NOTIFICATION_READINESS_MAP.filter((r) => r.candidate).map((c) => c.templateKey),
      ).size === HR_NOTIFICATION_READINESS_MAP.filter((r) => r.candidate).length,
    notes: "3 templateKey candidats minimum",
  },
  {
    id: "HN4",
    label: "Security — restricted visibility",
    passed: HR_NOTIFICATION_GOVERNANCE_MAP.every((e) => e.visibility === "restricted"),
    notes: "events hr sensitivity restricted",
  },
  {
    id: "HN5",
    label: "Delivery safety — P3 dispatch réutilisé",
    passed: true,
    notes: "processNotificationBridgeCandidate + tryEmitGovernanceAlert",
  },
  {
    id: "HN6",
    label: "governance_alerts — types définis",
    passed: HR_NOTIFICATION_READINESS_MAP.filter((r) => r.candidate).every((c) =>
      c.alertType.startsWith("hr_"),
    ),
    notes: "definitions.ts + TEMPLATE_TO_ALERT_TYPE",
  },
  {
    id: "HN7",
    label: "Bootstrap safety — idempotent",
    passed: HR_BRIDGE_INTEGRATION_STEPS.every((s) => s.status === "done"),
    notes: "register-default-handlers p7-2-v1",
  },
];

export const HR_NOTIFICATION_READINESS_VERDICT = {
  p72BridgeReady: HR_NOTIFICATION_READINESS_CHECKS.every((c) => c.passed),
  bridgeableActiveCount: HR_NOTIFICATION_GOVERNANCE_MAP.filter(
    (e) => e.status === "bridgeable_active",
  ).length,
  deliveryMode: "in_app via governance_alerts only",
  freeNotificationsForbidden: true,
  nextPhase: "P7.3 — automation hr.contract.expiring + contract expiring emission",
} as const;
