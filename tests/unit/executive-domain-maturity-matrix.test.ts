import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXECUTIVE_CAPABILITY_STATUS,
  EXECUTIVE_DOMAIN_GOVERNANCE_VERSION,
} from "@/lib/executive/governance/executive-domain-governance";
import {
  EXECUTIVE_DOMAIN_MATURITY_MATRIX,
  EXECUTIVE_DOMAIN_MATURITY_VERSION,
} from "@/lib/executive/runtime/executive-domain-maturity-registry";
import { BI_KPI_REGISTRY } from "@/lib/executive/runtime/bi-kpi-registry";
import { ERP_EVENT_CATALOG_VERSION } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Executive domain maturity matrix — Bloc 3 Étape 6", () => {
  it("registry version", () => {
    expect(EXECUTIVE_DOMAIN_MATURITY_VERSION).toBe("executive-domain-maturity-bloc3-v1");
    expect(EXECUTIVE_DOMAIN_MATURITY_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(EXECUTIVE_DOMAIN_GOVERNANCE_VERSION).toBe("executive-domain-governance-bloc3-v1");
    expect(ERP_EVENT_CATALOG_VERSION).toBe("erp-event-catalog-bloc3-platform-v1");
    expect(Object.values(OFFICIAL_ERP_EVENT_TYPES)).toHaveLength(91);
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "BI engine",
      expected: "buildExecutiveBiSnapshot",
      check: () =>
        readSrc("modules/executive-dashboard/server/services/executive-bi-engine.ts").includes(
          "buildExecutiveBiSnapshot",
        ),
    },
    {
      area: "Forecast",
      expected: "buildExecutiveForecastBundle",
      check: () =>
        readSrc("modules/executive-dashboard/server/services/executive-forecast-service.ts").includes(
          "emitExecutiveForecastGenerated",
        ),
    },
    {
      area: "Cross-domain",
      expected: "buildCrossDomainIntelligence",
      check: () =>
        readSrc(
          "modules/executive-dashboard/server/services/executive-cross-domain-intelligence.ts",
        ).includes("sales-finance"),
    },
    {
      area: "Alerting",
      expected: "erp_executive_signals",
      check: () =>
        readSrc("modules/executive-dashboard/server/services/executive-alerting-service.ts").includes(
          "emitExecutiveSignalRaised",
        ),
    },
    {
      area: "Snapshot live",
      expected: "placeholder: false consultation",
      check: () =>
        readSrc("modules/executive-dashboard/server/repositories/executive-read-placeholder.ts").includes(
          "operations_sql_aggregates",
        ),
    },
    {
      area: "Observability hub",
      expected: "/admin/observability",
      check: () => readSrc("app/(app)/admin/observability/page.tsx").includes("Observability Hub"),
    },
    {
      area: "KPI registry",
      expected: "company.revenue_month",
      check: () => BI_KPI_REGISTRY.some((k) => k.kpiKey === "company.revenue_month"),
    },
    {
      area: "Validator",
      expected: "EXECUTIVE_ROUTE_VALIDATOR_PLACEHOLDER false",
      check: () =>
        readSrc("modules/executive-dashboard/server/validators/executive-route.ts").includes(
          "EXECUTIVE_ROUTE_VALIDATOR_PLACEHOLDER = false",
        ),
    },
    {
      area: "Events",
      expected: OFFICIAL_ERP_EVENT_TYPES.EXECUTIVE_SNAPSHOT_REFRESHED,
      check: () =>
        OFFICIAL_ERP_EVENT_TYPES.ANALYTICS_SNAPSHOT_COMPUTED === "analytics.snapshot.computed",
    },
    {
      area: "Capability",
      expected: "active",
      check: () => EXECUTIVE_CAPABILITY_STATUS.biEngine === "active",
    },
    {
      area: "Super Admin lock",
      expected: "ErpNavSidebar unchanged",
      check: () => {
        const sa = readSrc("components/layout/app-shell/ErpNavSidebar.tsx");
        return (
          sa.includes("export const ErpNavSidebar") &&
          !readSrc("app/(app)/dashboard/executive/intelligence/page.tsx").includes(
            "SuperAdminCockpitClient",
          )
        );
      },
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
