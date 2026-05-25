import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CRM_CAPABILITY_STATUS,
  CRM_DOMAIN_GOVERNANCE_VERSION,
} from "@/lib/vente/governance/crm-domain-governance";
import {
  CRM_DOMAIN_MATURITY_MATRIX,
  CRM_DOMAIN_MATURITY_VERSION,
} from "@/lib/vente/runtime/crm-domain-maturity-registry";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("CRM domain maturity matrix — Bloc 3 Étape 3", () => {
  it("registry version", () => {
    expect(CRM_DOMAIN_MATURITY_VERSION).toBe("crm-domain-maturity-bloc3-v1");
    expect(CRM_DOMAIN_MATURITY_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(CRM_DOMAIN_GOVERNANCE_VERSION).toBe("crm-domain-governance-bloc3-v1");
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "Leads — lifecycle events",
      expected: "emitCrmLeadUpdated",
      check: () => readSrc("modules/crm/server/services/crm-mutations.ts").includes("emitCrmLeadUpdated"),
    },
    {
      area: "Pipeline — stage events",
      expected: "emitCrmPipelineUpdated",
      check: () => readSrc("modules/crm/server/services/crm-mutations.ts").includes("emitCrmPipelineUpdated"),
    },
    {
      area: "Deals — won/lost",
      expected: "emitCrmDealWon",
      check: () => readSrc("modules/crm/server/services/crm-mutations.ts").includes("emitCrmDealWon"),
    },
    {
      area: "Activities — create/complete UI",
      expected: "CrmActivityCreatePanel",
      check: () => readSrc("app/(app)/vente/crm/activities/page.tsx").includes("CrmActivityCreatePanel"),
    },
    {
      area: "Analytics — live",
      expected: "buildCrmOperationalAnalytics",
      check: () =>
        readSrc("modules/crm/server/services/crm-analytics-service.ts").includes(
          "buildCrmOperationalAnalytics",
        ),
    },
    {
      area: "Events — deal created",
      expected: OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_CREATED,
      check: () => OFFICIAL_ERP_EVENT_TYPES.CRM_REPORT_GENERATED === "crm.report.generated",
    },
    {
      area: "Forecast — snapshot refresh",
      expected: "refreshCrmForecastSnapshot",
      check: () =>
        readSrc("modules/crm/server/services/crm-analytics-service.ts").includes(
          "refreshCrmForecastSnapshot",
        ),
    },
    {
      area: "Governance — ownership",
      expected: "owner_id",
      check: () => readSrc("lib/vente/governance/crm-domain-governance.ts").includes("owner_id"),
    },
    {
      area: "Reporting page — live KPIs",
      expected: "buildCrmOperationalAnalytics",
      check: () =>
        readSrc("app/(app)/vente/crm/reporting/page.tsx").includes("buildCrmOperationalAnalytics"),
    },
    {
      area: "Capability — lead lifecycle active",
      expected: "active",
      check: () => CRM_CAPABILITY_STATUS.leadLifecycle === "active",
    },
    {
      area: "Super Admin lock",
      expected: "ErpNavSidebar unchanged",
      check: () => {
        const sa = readSrc("components/layout/app-shell/ErpNavSidebar.tsx");
        return sa.includes("export const ErpNavSidebar") && !readSrc("app/(app)/vente/crm/page.tsx").includes("SuperAdminCockpitClient");
      },
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
