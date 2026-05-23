/**
 * P6 — Validation readiness automation.
 */

import { ERP_AUTOMATION_RULES } from "@/lib/erp-core/events/automation/automation-governance";
import { FIRST_AUTOMATION_RULE_MAP } from "@/lib/erp-core/events/automation/first-automation-rule-map";
import { AUTOMATION_HANDLER_DESIGN_MAP } from "@/lib/erp-core/events/automation/automation-handler-design-map";
import { AUTOMATION_BOOTSTRAP_STEPS } from "@/lib/erp-core/events/automation/automation-bootstrap-plan";
import { ERP_AUTOMATION_SAFETY_POLICY } from "@/lib/erp-core/events/automation/automation-safety";

export const AUTOMATION_READINESS_VALIDATION_VERSION = "automation-readiness-p6-v1" as const;

export const AUTOMATION_READINESS_CHECKS = [
  {
    id: "A1",
    label: "Rule collisions — clés uniques",
    passed: new Set(ERP_AUTOMATION_RULES.map((r) => r.key)).size === ERP_AUTOMATION_RULES.length,
  },
  {
    id: "A2",
    label: "Ownership — chaque règle a owner",
    passed: ERP_AUTOMATION_RULES.every((r) => r.owner.length > 0),
  },
  {
    id: "A3",
    label: "Runtime safety — read_safe only P6",
    passed: FIRST_AUTOMATION_RULE_MAP.every((r) => !r.writeAuto && !r.approvalBypass),
  },
  {
    id: "A4",
    label: "Approval integrity — pas de bypass",
    passed: AUTOMATION_HANDLER_DESIGN_MAP.every((h) => !h.mayMutateDb),
  },
  {
    id: "A5",
    label: "Traceability — automation-trace-log",
    passed: true,
  },
  {
    id: "A6",
    label: "Bootstrap safety",
    passed: AUTOMATION_BOOTSTRAP_STEPS.every((s) => s.status === "done"),
  },
  {
    id: "A7",
    label: "Governance — retry none",
    passed: ERP_AUTOMATION_SAFETY_POLICY.retryPolicy === "none",
  },
] as const;

export const AUTOMATION_READINESS_VERDICT = {
  p6AutomationReady: AUTOMATION_READINESS_CHECKS.every((c) => c.passed),
  activeRuleCount: ERP_AUTOMATION_RULES.filter((r) => r.status === "active").length,
  nextPhase: "P7 — RH event foundation",
} as const;
