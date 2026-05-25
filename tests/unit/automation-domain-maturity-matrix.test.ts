import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTOMATION_CAPABILITY_STATUS,
  AUTOMATION_DOMAIN_GOVERNANCE_VERSION,
} from "@/lib/automation/governance/automation-domain-governance";
import {
  AUTOMATION_DOMAIN_MATURITY_MATRIX,
  AUTOMATION_DOMAIN_MATURITY_VERSION,
} from "@/lib/automation/runtime/automation-domain-maturity-registry";
import {
  ERP_AUTOMATION_GOVERNANCE_SUMMARY,
  ERP_AUTOMATION_GOVERNANCE_VERSION,
} from "@/lib/erp-core/events/automation/automation-governance";
import { ERP_EVENT_CATALOG_VERSION, listAutomationGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Automation domain maturity matrix — Bloc 3 Étape 7", () => {
  it("registry version", () => {
    expect(AUTOMATION_DOMAIN_MATURITY_VERSION).toBe("automation-domain-maturity-bloc3-v1");
    expect(AUTOMATION_DOMAIN_MATURITY_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(AUTOMATION_DOMAIN_GOVERNANCE_VERSION).toBe("automation-domain-governance-bloc3-v1");
    expect(ERP_EVENT_CATALOG_VERSION).toBe("erp-event-catalog-bloc3-platform-v1");
    expect(Object.values(OFFICIAL_ERP_EVENT_TYPES)).toHaveLength(91);
    expect(listAutomationGovernanceEvents()).toHaveLength(9);
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "Rule engine",
      expected: "ERP_AUTOMATION_RULES active",
      check: () => ERP_AUTOMATION_GOVERNANCE_SUMMARY.activeRules >= 11,
    },
    {
      area: "Cross-domain bridge",
      expected: "automation-orchestration-bridge",
      check: () =>
        readSrc("lib/erp-core/events/handlers/automation-orchestration-bridge.ts").includes(
          "emitAutomationCrossDomainOrchestrated",
        ),
    },
    {
      area: "AI orchestration",
      expected: "ai-decision-support-orchestration",
      check: () =>
        readSrc("modules/ai/server/services/ai-decision-support-orchestration.ts").includes(
          "erp_ai_recommendations",
        ),
    },
    {
      area: "Admin cockpit",
      expected: "/admin/automation",
      check: () => readSrc("app/(app)/admin/automation/page.tsx").includes("Automation Cockpit"),
    },
    {
      area: "Observability",
      expected: "erp_automation_rule_executions",
      check: () =>
        readSrc("modules/automation/server/services/automation-observability-metrics.ts").includes(
          "erp_automation_rule_executions",
        ),
    },
    {
      area: "Bootstrap",
      expected: "bloc3-automation-v1",
      check: () =>
        readSrc("lib/erp-core/events/bootstrap/register-default-handlers.ts").includes(
          "registerAiOrchestrationBridgeHandler",
        ),
    },
    {
      area: "Governance version",
      expected: "bloc3-v1",
      check: () => ERP_AUTOMATION_GOVERNANCE_VERSION === "erp-automation-governance-bloc3-v1",
    },
    {
      area: "Capabilities",
      expected: "cockpit active",
      check: () => AUTOMATION_CAPABILITY_STATUS.cockpit === "active",
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
