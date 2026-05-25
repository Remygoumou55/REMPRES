import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  PLATFORM_CAPABILITY_STATUS,
  PLATFORM_DOMAIN_GOVERNANCE_VERSION,
} from "@/lib/platform/governance/platform-domain-governance";
import {
  PLATFORM_DOMAIN_MATURITY_MATRIX,
  PLATFORM_DOMAIN_MATURITY_VERSION,
} from "@/lib/platform/runtime/platform-domain-maturity-registry";
import { PLATFORM_API_GOVERNANCE_REGISTRY } from "@/lib/platform/governance/api-governance-registry";
import { ERP_EVENT_CATALOG_VERSION, listPlatformGovernanceEvents } from "@/lib/erp-core/events/governance/event-catalog-governance";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Platform domain maturity matrix — Bloc 3 Étape 8", () => {
  it("registry version", () => {
    expect(PLATFORM_DOMAIN_MATURITY_VERSION).toBe("platform-domain-maturity-bloc3-v1");
    expect(PLATFORM_DOMAIN_MATURITY_MATRIX.length).toBeGreaterThanOrEqual(7);
    expect(PLATFORM_DOMAIN_GOVERNANCE_VERSION).toBe("platform-domain-governance-bloc3-v1");
    expect(ERP_EVENT_CATALOG_VERSION).toBe("erp-event-catalog-bloc3-platform-v1");
    expect(Object.values(OFFICIAL_ERP_EVENT_TYPES)).toHaveLength(91);
    expect(listPlatformGovernanceEvents()).toHaveLength(9);
    expect(PLATFORM_API_GOVERNANCE_REGISTRY.length).toBeGreaterThanOrEqual(4);
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "API governance",
      expected: "api-invocation-guard",
      check: () => readSrc("lib/platform/runtime/api-invocation-guard.ts").includes("checkApiInvocationAllowed"),
    },
    {
      area: "Connector engine",
      expected: "runConnectorHealthProbe",
      check: () =>
        readSrc("modules/platform/server/services/connector-engine-service.ts").includes(
          "runConnectorHealthProbe",
        ),
    },
    {
      area: "Integration framework",
      expected: "connectPlatformIntegration",
      check: () =>
        readSrc("modules/platform/server/services/integration-framework-service.ts").includes(
          "connectPlatformIntegration",
        ),
    },
    {
      area: "Marketplace",
      expected: "erp_platform_catalog_plugins",
      check: () =>
        readSrc("modules/platform/server/services/marketplace-catalog-service.ts").includes(
          "publishMarketplaceListing",
        ),
    },
    {
      area: "Developer ecosystem",
      expected: "DEVELOPER_ECOSYSTEM_GUIDE",
      check: () =>
        readSrc("lib/platform/runtime/developer-ecosystem-registry.ts").includes("DEVELOPER_ECOSYSTEM_GUIDE"),
    },
    {
      area: "Admin cockpit",
      expected: "/admin/platform",
      check: () => readSrc("app/(app)/admin/platform/page.tsx").includes("Platform Cockpit"),
    },
    {
      area: "Observability",
      expected: "buildPlatformObservabilityMetrics",
      check: () =>
        readSrc("modules/platform/server/services/platform-observability-metrics.ts").includes(
          "erp_platform_api_audit_log",
        ),
    },
    {
      area: "Capabilities",
      expected: "marketplaceFoundation active",
      check: () => PLATFORM_CAPABILITY_STATUS.marketplaceFoundation === "active",
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
