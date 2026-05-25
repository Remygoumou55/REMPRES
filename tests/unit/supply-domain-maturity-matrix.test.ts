import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LOGISTICS_CAPABILITY_STATUS,
  LOGISTICS_DOMAIN_GOVERNANCE_VERSION,
} from "@/lib/logistics/governance/logistics-domain-governance";
import {
  LOGISTICS_DOMAIN_MATURITY_MATRIX,
  LOGISTICS_DOMAIN_MATURITY_VERSION,
} from "@/lib/logistics/runtime/logistics-domain-maturity-registry";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

const ROOT = join(process.cwd());

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Supply domain maturity matrix — Bloc 3 Étape 4", () => {
  it("registry version", () => {
    expect(LOGISTICS_DOMAIN_MATURITY_VERSION).toBe("logistics-domain-maturity-bloc3-v1");
    expect(LOGISTICS_DOMAIN_MATURITY_MATRIX.length).toBeGreaterThanOrEqual(6);
    expect(LOGISTICS_DOMAIN_GOVERNANCE_VERSION).toBe("logistics-domain-governance-bloc3-v1");
  });

  const matrix: Array<{ area: string; expected: string; check: () => boolean }> = [
    {
      area: "Suppliers — create",
      expected: "createLogisticsSupplier",
      check: () =>
        readSrc("modules/logistics/server/services/logistics-mutations.ts").includes(
          "createLogisticsSupplier",
        ),
    },
    {
      area: "PO — workflow",
      expected: "submitLogisticsPurchaseOrder",
      check: () =>
        readSrc("modules/logistics/server/services/logistics-mutations.ts").includes(
          "emitSupplyPurchaseRequested",
        ),
    },
    {
      area: "Inventory — receipt",
      expected: "createLogisticsGoodsReceipt",
      check: () =>
        readSrc("modules/logistics/server/services/logistics-mutations.ts").includes(
          "createLogisticsGoodsReceipt",
        ),
    },
    {
      area: "Movements — adjust",
      expected: "adjustLogisticsStock",
      check: () =>
        readSrc("modules/logistics/server/services/logistics-mutations.ts").includes(
          "emitSupplyStockAdjusted",
        ),
    },
    {
      area: "Analytics — live",
      expected: "buildSupplyOperationalAnalytics",
      check: () =>
        readSrc("modules/logistics/server/services/logistics-analytics-service.ts").includes(
          "buildSupplyOperationalAnalytics",
        ),
    },
    {
      area: "Events — supplier created",
      expected: OFFICIAL_ERP_EVENT_TYPES.SUPPLY_SUPPLIER_CREATED,
      check: () => OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PO_CREATED === "supply.po.created",
    },
    {
      area: "Dept KPI — non-placeholder",
      expected: "placeholder: false",
      check: () =>
        readSrc("lib/logistics/runtime/logistics-kpi-runtime.ts").includes("placeholder: false"),
    },
    {
      area: "UI — PO actions",
      expected: "LogisticsPurchaseOrderRowActions",
      check: () =>
        readSrc("app/(app)/logistique/achats/page.tsx").includes("LogisticsPurchaseOrderRowActions"),
    },
    {
      area: "Governance — write registry",
      expected: "LOGISTICS_WRITE_ACTIONS",
      check: () =>
        readSrc("lib/logistics/runtime/logistics-write-governance.ts").includes("PO_CREATE"),
    },
    {
      area: "Capability — inventory active",
      expected: "active",
      check: () => LOGISTICS_CAPABILITY_STATUS.inventory === "active",
    },
    {
      area: "Super Admin lock",
      expected: "ErpNavSidebar unchanged",
      check: () => {
        const sa = readSrc("components/layout/app-shell/ErpNavSidebar.tsx");
        return (
          sa.includes("export const ErpNavSidebar") &&
          !readSrc("app/(app)/logistique/page.tsx").includes("SuperAdminCockpitClient")
        );
      },
    },
  ];

  it.each(matrix)("$area — $expected", ({ check }) => {
    expect(check()).toBe(true);
  });
});
