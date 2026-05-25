import { describe, expect, it } from "vitest";
import {
  ERP_EVENT_GOVERNANCE_MAP,
  ERP_EVENT_CATALOG_VERSION,
  listFinanceGovernanceEvents,
} from "@/lib/erp-core/events/governance/event-catalog-governance";
import { FINANCE_EVENT_GOVERNANCE_AMENDMENT } from "@/lib/erp-core/events/governance/finance-event-governance-amendment";
import { FINANCE_PUBLISHER_DESIGN_MAP } from "@/lib/erp-core/events/governance/finance-publisher-design-map";
import { FINANCE_WRITE_ACTIVATION_TABLE } from "@/lib/erp-core/events/foundation/finance-write-activation-plan";
import { FINANCE_MUTATION_INTEGRATION_TABLE } from "@/lib/erp-core/events/foundation/finance-mutation-integration-plan";
import { FINANCE_EVENT_READINESS_VERDICT } from "@/lib/erp-core/events/foundation/finance-event-readiness-validation";
import {
  FINANCE_EVENT_READINESS_TABLE,
  FINANCE_OFFICIAL_EVENT_SLOTS,
} from "@/lib/erp-core/events/foundation/finance-event-readiness";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

describe("P4 — Finance Event Activation (governance)", () => {
  it("catalogue Bloc3 — 55 types dont 11 finance", () => {
    expect(ERP_EVENT_CATALOG_VERSION).toBe("erp-event-catalog-bloc3-supply-v1");
    expect(ERP_EVENT_GOVERNANCE_MAP.length).toBe(55);
    const finance = listFinanceGovernanceEvents();
    expect(finance).toHaveLength(11);
    expect(finance.filter((e) => e.status === "active").length).toBeGreaterThanOrEqual(10);
  });

  it("amendment P4 — 4 slots officiels minimum", () => {
    expect(FINANCE_EVENT_GOVERNANCE_AMENDMENT).toHaveLength(4);
    expect(FINANCE_OFFICIAL_EVENT_SLOTS).toContain(
      OFFICIAL_ERP_EVENT_TYPES.FINANCE_TRANSACTION_RECORDED,
    );
    expect(FINANCE_OFFICIAL_EVENT_SLOTS).toContain(
      OFFICIAL_ERP_EVENT_TYPES.FINANCE_THRESHOLD_EXCEEDED,
    );
  });

  it("publisher design map — 3 catalog + 3 active (P6.1 threshold)", () => {
    const ready = FINANCE_PUBLISHER_DESIGN_MAP.filter((p) => p.wirePhase === "publisher_ready");
    const active = FINANCE_PUBLISHER_DESIGN_MAP.filter((p) => p.wirePhase === "active");
    expect(ready.length).toBeGreaterThanOrEqual(3);
    expect(active.length).toBe(3);
  });

  it("write activation — expense enabled seulement", () => {
    const enabled = FINANCE_WRITE_ACTIVATION_TABLE.filter((r) => r.registryEnabled);
    expect(enabled).toHaveLength(2);
    expect(FINANCE_EVENT_READINESS_TABLE.filter((r) => r.registryEnabled)).toHaveLength(2);
  });

  it("mutation integration — 2 expense done (P4.1)", () => {
    const done = FINANCE_MUTATION_INTEGRATION_TABLE.filter((r) => r.integrationPhase === "done");
    expect(done.length).toBeGreaterThanOrEqual(2);
  });

  it("readiness verdict — gouvernance READY, writes expense READY", () => {
    expect(FINANCE_EVENT_READINESS_VERDICT.p4GovernanceReady).toBe(true);
    expect(FINANCE_EVENT_READINESS_VERDICT.writeActivationReady).toBe(true);
  });
});
