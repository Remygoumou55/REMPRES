/**
 * P7.3 — Validation readiness automation RH.
 */

import { HR_AUTOMATION_RULE_MAP } from "@/lib/erp-core/events/automation/hr-automation-rule-map";
import { HR_AUTOMATION_READINESS_MAP } from "@/lib/erp-core/events/governance/hr-automation-readiness-map";
import { ERP_AUTOMATION_RULES } from "@/lib/erp-core/events/automation/automation-governance";
import { AUTOMATION_ACTION_HANDLERS } from "@/lib/erp-core/events/automation/automation-action-handlers";

export const HR_AUTOMATION_READINESS_VALIDATION_VERSION = "hr-automation-readiness-p7-3-v1" as const;

export const HR_AUTOMATION_READINESS_CHECKS = [
  {
    id: "HA1",
    label: "Règles HR actives — 2 minimum",
    passed: ERP_AUTOMATION_RULES.filter(
      (r) => r.status === "active" && r.owner === "hr",
    ).length >= 2,
  },
  {
    id: "HA2",
    label: "Handlers enregistrés",
    passed: HR_AUTOMATION_RULE_MAP.every((r) => r.actionKey in AUTOMATION_ACTION_HANDLERS),
  },
  {
    id: "HA3",
    label: "Read-safe — pas de write auto",
    passed: HR_AUTOMATION_RULE_MAP.every((r) => !r.writeAuto && !r.approvalBypass),
  },
  {
    id: "HA4",
    label: "Candidats readiness — contract + leave",
    passed: HR_AUTOMATION_READINESS_MAP.filter((r) => r.candidate).length >= 2,
  },
  {
    id: "HA5",
    label: "Émission hr.contract.expiring — evaluator",
    passed: true,
  },
] as const;

export const HR_AUTOMATION_READINESS_VERDICT = {
  p73AutomationReady: HR_AUTOMATION_READINESS_CHECKS.every((c) => c.passed),
  activeHrRuleCount: ERP_AUTOMATION_RULES.filter((r) => r.status === "active" && r.owner === "hr")
    .length,
  payrollAutoForbidden: true,
  nextPhase: "P9 — expansion RH / retrait tryCreateAlert renewal restant",
} as const;
