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
    expect(Object.values(OFFICIAL_ERP_EVENT_TYPES)).toHaveLength(14);
  });

  it("catalogue — 5 événements CRM (prefix crm.)", () => {
    const crm = listCrmGovernanceEvents();
    expect(crm).toHaveLength(5);
    expect(ERP_EVENT_GOVERNANCE_MAP).toHaveLength(14);
  });

  it("publisher design — 3 publishers P1 actifs (P1.1)", () => {
    const wired = CRM_PUBLISHER_DESIGN_MAP.filter(
      (p) =>
        p.wirePhase === "active" &&
        ["emitCrmLeadCreated", "emitCrmQuoteCreated", "emitCrmQuoteStatusUpdated"].includes(
          p.publisher,
        ),
    );
    expect(wired).toHaveLength(3);
  });

  it("integration plan — 4 mutations done (convert + P1.1)", () => {
    const done = CRM_MUTATION_INTEGRATION_TABLE.filter((r) => r.integrationPhase === "done");
    expect(done.length).toBeGreaterThanOrEqual(4);
  });

  it("crm-mutations — publishers P1.1 câblés", () => {
    const src = readFileSync(
      join(process.cwd(), "modules/crm/server/services/crm-mutations.ts"),
      "utf8",
    );
    expect(src).toContain("emitCrmLeadCreated");
    expect(src).toContain("emitCrmQuoteCreated");
    expect(src).toContain("emitCrmQuoteStatusUpdated");
  });
});
