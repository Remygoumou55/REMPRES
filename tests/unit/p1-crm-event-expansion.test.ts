import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import {
  ERP_EVENT_GOVERNANCE_MAP,
  listCrmGovernanceEvents,
} from "@/lib/erp-core/events/governance/event-catalog-governance";
import { CRM_PUBLISHER_DESIGN_MAP } from "@/lib/erp-core/events/governance/crm-publisher-design-map";
import { CRM_MUTATION_INTEGRATION_TABLE } from "@/lib/erp-core/events/foundation/crm-mutation-integration-plan";

describe("P1 — CRM Event Expansion", () => {
  it("taxonomy P1 — 3 nouveaux types CRM officiels", () => {
    expect(OFFICIAL_ERP_EVENT_TYPES.CRM_LEAD_CREATED).toBe("crm.lead.created");
    expect(OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_CREATED).toBe("crm.quote.created");
    expect(OFFICIAL_ERP_EVENT_TYPES.CRM_QUOTE_STATUS_UPDATED).toBe("crm.quote.status_updated");
    expect(Object.values(OFFICIAL_ERP_EVENT_TYPES)).toHaveLength(91);
  });

  it("catalogue — 14 événements CRM (prefix crm.)", () => {
    const crm = listCrmGovernanceEvents();
    expect(crm).toHaveLength(14);
    expect(crm.filter((e) => e.status === "active").length).toBeGreaterThanOrEqual(13);
    expect(ERP_EVENT_GOVERNANCE_MAP).toHaveLength(91);
  });

  it("publisher design — publishers Bloc 3 actifs", () => {
    const wired = CRM_PUBLISHER_DESIGN_MAP.filter((p) => p.wirePhase === "active");
    expect(wired.length).toBeGreaterThanOrEqual(3);
  });

  it("integration plan — mutations CRM câblées bus", () => {
    const done = CRM_MUTATION_INTEGRATION_TABLE.filter((r) => r.integrationPhase === "done");
    expect(done.length).toBeGreaterThanOrEqual(4);
  });

  it("crm-mutations — bus lifecycle complet", () => {
    const src = readFileSync(
      join(process.cwd(), "modules/crm/server/services/crm-mutations.ts"),
      "utf8",
    );
    expect(src).toContain("emitCrmLeadCreated");
    expect(src).toContain("emitCrmLeadUpdated");
    expect(src).toContain("emitCrmDealCreated");
    expect(src).toContain("emitCrmPipelineUpdated");
    expect(src).toContain("emitCrmActivityCreated");
  });
});
