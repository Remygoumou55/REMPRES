import { describe, expect, it } from "vitest";
import { validateExecutiveSnapshot } from "@/modules/executive-dashboard/server/validators";
import { validateAdminPlatformAggregates } from "@/modules/admin-platform-dashboard/server/validators";

describe("executive/admin KPI validators", () => {
  it("sanitizes executive non-finite KPI values", () => {
    const validated = validateExecutiveSnapshot({
      id: "executive_global_v1",
      domains: {
        vente: {
          stats: [{ id: "x", label: "x", value: Number.NaN, unit: "count" }],
          charts: [],
          alerts: [],
          activity: [],
          health: { status: "ok" },
          metadata: { source: "test", generatedAt: new Date().toISOString(), placeholder: false },
        },
      },
      meta: { engineVersion: "1.0.0", correlationId: "c1", generatedAtIso: new Date().toISOString() },
      executiveMeta: { correlationId: "c1", domainsLoaded: 1, domainsFailed: 0 },
    });
    expect(validated.domains.vente?.stats[0]?.value).toBe(0);
  });

  it("sanitizes admin aggregates", () => {
    const validated = validateAdminPlatformAggregates({
      jobsPending: -5,
      jobsFailed24h: Number.POSITIVE_INFINITY,
      incidentsOpen: 2,
      anomaliesOpen: 1,
      riskSignalsOpen: 3,
      tenantsActive: 4,
      tenantSnapshots: 5,
      scopeHash: "",
    });
    expect(validated.jobsPending).toBe(0);
    expect(validated.jobsFailed24h).toBe(0);
    expect(validated.scopeHash).toBe("");
  });
});
