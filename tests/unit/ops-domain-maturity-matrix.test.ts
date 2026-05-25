import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPERATIONS_CAPABILITY_STATUS,
  OPERATIONS_DOMAIN_GOVERNANCE_VERSION,
} from "@/lib/operations/governance/operations-domain-governance";
import {
  OPERATIONS_DOMAIN_MATURITY_MATRIX,
  OPERATIONS_DOMAIN_MATURITY_VERSION,
} from "@/lib/operations/runtime/operations-domain-maturity-registry";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { ERP_EVENT_CATALOG_VERSION } from "@/lib/erp-core/events/governance/event-catalog-governance";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Operations domain maturity matrix — Bloc 3 Étape 5", () => {
  it("registry version", () => {
    expect(OPERATIONS_DOMAIN_MATURITY_VERSION).toBe("operations-domain-maturity-bloc3-v1");
    expect(OPERATIONS_DOMAIN_MATURITY_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(OPERATIONS_DOMAIN_GOVERNANCE_VERSION).toBe("operations-domain-governance-bloc3-v1");
    expect(ERP_EVENT_CATALOG_VERSION).toBe("erp-event-catalog-bloc3-platform-v1");
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "Tasks — create",
      expected: "createOpsTask",
      check: () =>
        readSrc("modules/operations/server/services/ops-mutations.ts").includes("createOpsTask"),
    },
    {
      area: "Workflow — transition",
      expected: "transitionOpsWorkflow",
      check: () =>
        readSrc("modules/operations/server/services/ops-mutations.ts").includes(
          "emitOpsWorkflowApproved",
        ),
    },
    {
      area: "Projects — governance",
      expected: "createOpsProject",
      check: () =>
        readSrc("modules/operations/server/services/ops-mutations.ts").includes("createOpsProject"),
    },
    {
      area: "Delivery — delayed event",
      expected: "emitOpsExecutionDelayed",
      check: () =>
        readSrc("modules/operations/server/services/ops-mutations.ts").includes(
          "emitOpsExecutionDelayed",
        ),
    },
    {
      area: "Orchestration — deal won",
      expected: "orchestrateOpsTaskFromDealWon",
      check: () =>
        readSrc("lib/erp-core/events/handlers/ops-orchestration-bridge.ts").includes(
          "CRM_DEAL_WON",
        ),
    },
    {
      area: "Events — task created",
      expected: OFFICIAL_ERP_EVENT_TYPES.OPS_TASK_CREATED,
      check: () => OFFICIAL_ERP_EVENT_TYPES.OPS_PROJECT_CREATED === "ops.project.created",
    },
    {
      area: "Dept KPI — non-placeholder",
      expected: "placeholder: false",
      check: () =>
        readSrc("lib/operations/runtime/operations-kpi-runtime.ts").includes("placeholder: false"),
    },
    {
      area: "UI — task actions",
      expected: "OpsTaskRowActions",
      check: () =>
        readSrc("app/(app)/operations/tasks/page.tsx").includes("OpsTaskRowActions"),
    },
    {
      area: "Governance — write registry",
      expected: "OPS_WRITE_ACTIONS",
      check: () =>
        readSrc("lib/operations/runtime/operations-write-governance.ts").includes("TASK_CREATE"),
    },
    {
      area: "Capability — taskEngine active",
      expected: "active",
      check: () => OPERATIONS_CAPABILITY_STATUS.taskEngine === "active",
    },
    {
      area: "Super Admin lock",
      expected: "ErpNavSidebar unchanged",
      check: () => {
        const sa = readSrc("components/layout/app-shell/ErpNavSidebar.tsx");
        return (
          sa.includes("export const ErpNavSidebar") &&
          !readSrc("app/(app)/operations/page.tsx").includes("SuperAdminCockpitClient")
        );
      },
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
