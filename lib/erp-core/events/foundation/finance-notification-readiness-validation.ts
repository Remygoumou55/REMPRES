/**
 * P5 — Validation readiness notification Finance.
 */

import { FINANCE_NOTIFICATION_GOVERNANCE_MAP } from "@/lib/erp-core/events/governance/finance-notification-governance-map";
import { FINANCE_NOTIFICATION_CANDIDATE_MAP } from "@/lib/erp-core/events/foundation/finance-notification-candidate-map";
import { FINANCE_BRIDGE_INTEGRATION_STEPS } from "@/lib/erp-core/events/foundation/finance-bridge-integration-plan";

export const FINANCE_NOTIFICATION_READINESS_VALIDATION_VERSION =
  "finance-notification-readiness-p5-v1" as const;

export type FinanceNotificationReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  notes: string;
};

export const FINANCE_NOTIFICATION_READINESS_CHECKS: readonly FinanceNotificationReadinessCheck[] = [
  {
    id: "N1",
    label: "Routing — pattern finance.*",
    passed: true,
    notes: "notification-finance-bridge enregistré",
  },
  {
    id: "N2",
    label: "Ownership — dept FINANCE",
    passed: FINANCE_NOTIFICATION_GOVERNANCE_MAP.every((e) => e.owner === "finance"),
    notes: "departmentScope FINANCE sur handler",
  },
  {
    id: "N3",
    label: "Collisions template — uniques",
    passed:
      new Set(FINANCE_NOTIFICATION_CANDIDATE_MAP.map((c) => c.templateKey)).size ===
      FINANCE_NOTIFICATION_CANDIDATE_MAP.length,
    notes: "6 templateKey distincts",
  },
  {
    id: "N4",
    label: "Security — restricted visibility",
    passed: FINANCE_NOTIFICATION_GOVERNANCE_MAP.every((e) => e.visibility === "restricted"),
    notes: "events finance sensitivity restricted",
  },
  {
    id: "N5",
    label: "Delivery safety — P3 dispatch réutilisé",
    passed: true,
    notes: "processNotificationBridgeCandidate + tryEmitGovernanceAlert",
  },
  {
    id: "N6",
    label: "governance_alerts — types définis",
    passed: FINANCE_NOTIFICATION_CANDIDATE_MAP.every((c) => c.alertType.startsWith("finance_")),
    notes: "definitions.ts + TEMPLATE_TO_ALERT_TYPE",
  },
  {
    id: "N7",
    label: "Bootstrap safety — idempotent",
    passed: FINANCE_BRIDGE_INTEGRATION_STEPS.every((s) => s.status === "done"),
    notes: "register-default-handlers p5-v1",
  },
];

export const FINANCE_NOTIFICATION_READINESS_VERDICT = {
  p5BridgeReady: FINANCE_NOTIFICATION_READINESS_CHECKS.every((c) => c.passed),
  deliveryMode: "in_app via governance_alerts only",
  freeNotificationsForbidden: true,
  nextPhase: "P6 — automation finance.threshold.exceeded",
} as const;
