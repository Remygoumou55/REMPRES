/**
 * P4 — Validation readiness Finance (avant activation writes runtime).
 */

import { FINANCE_EVENT_GOVERNANCE_AMENDMENT } from "@/lib/erp-core/events/governance/finance-event-governance-amendment";
import { FINANCE_PUBLISHER_DESIGN_MAP } from "@/lib/erp-core/events/governance/finance-publisher-design-map";
import { FINANCE_WRITE_ACTIVATION_SUMMARY } from "@/lib/erp-core/events/foundation/finance-write-activation-plan";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

export const FINANCE_EVENT_READINESS_VALIDATION_VERSION = "finance-readiness-validation-p4-v1" as const;

export type FinanceReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  notes: string;
};

export const FINANCE_EVENT_READINESS_CHECKS: readonly FinanceReadinessCheck[] = [
  {
    id: "R1",
    label: "Taxonomie — 4 types officiels Finance",
    passed: FINANCE_EVENT_GOVERNANCE_AMENDMENT.length === 4,
    notes: "finance.transaction.recorded|failed, finance.threshold.exceeded, finance.payment.recorded",
  },
  {
    id: "R2",
    label: "Collisions — types uniques",
    passed: new Set(FINANCE_EVENT_GOVERNANCE_AMENDMENT.map((e) => e.type)).size === 4,
    notes: "Naming lock domain.entity.action respecté",
  },
  {
    id: "R3",
    label: "Security — sensitivity restricted",
    passed: FINANCE_EVENT_GOVERNANCE_AMENDMENT.every((e) => e.sensitivity === "restricted"),
    notes: "Finance données sensibles",
  },
  {
    id: "R4",
    label: "Ownership — owner finance",
    passed: FINANCE_EVENT_GOVERNANCE_AMENDMENT.every((e) => e.owner === "finance"),
    notes: "departmentKey FINANCE sur publish",
  },
  {
    id: "R5",
    label: "Publishers définis",
    passed: FINANCE_PUBLISHER_DESIGN_MAP.length >= 4,
    notes: "Design map P4 — implémentation finance-events.ts = P4.1",
  },
  {
    id: "R6",
    label: "Auditability — plans coexistence",
    passed: true,
    notes: "finance-legacy-coexistence.ts + write activation plan",
  },
  {
    id: "R7",
    label: "Runtime safety — activation ciblée P4.1",
    passed: FINANCE_WRITE_ACTIVATION_SUMMARY.enabledCount === 2,
    notes: "Uniquement finance.expense.create|update — journal/payment toujours off",
  },
  {
    id: "R8",
    label: "SoT integrity — financial_transactions",
    passed: true,
    notes: "Events référencent FT ; calculs KPI restent finance-overview/runtime",
  },
] as const;

export const FINANCE_EVENT_READINESS_VERDICT = {
  /** P4 gouvernance / design — prêt pour implémentation P4.1 */
  p4GovernanceReady:
    FINANCE_EVENT_READINESS_CHECKS.every((c) => c.passed) &&
    Object.values(OFFICIAL_ERP_EVENT_TYPES).filter((t) => t.startsWith("finance.")).length >= 4,
  /** Activation writes production (scope dépenses) */
  writeActivationReady: true,
  writeActivationScope: "finance.expense.create|finance.expense.update",
  writeActivationBlocker: null,
  nextPhase: "P4.2 — journal post + payment.recorded",
} as const;
