jest.mock("@/lib/supabaseServer", () => ({
  getSupabaseServerClient: jest.fn(),
}));

jest.mock("@/lib/supabaseAdmin", () => ({
  getSupabaseAdminClient: jest.fn(),
}));

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { convertLeadToClient } from "@/lib/server/marketing";

const mockServer = getSupabaseServerClient as jest.Mock;
const mockAdmin = getSupabaseAdminClient as jest.Mock;

type QueryResult = { data: unknown; error: { message: string } | null };

function makeBuilder(result: QueryResult) {
  const builder: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    is: jest.fn(),
    order: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    single: jest.fn().mockResolvedValue(result),
  };
  for (const key of Object.keys(builder)) {
    if (key !== "maybeSingle" && key !== "single") {
      builder[key].mockReturnValue(builder);
    }
  }
  Object.defineProperty(builder, "then", {
    get: () => (resolve: (v: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
    configurable: true,
  });
  return builder;
}

const baseLead = {
  id: "lead-1",
  first_name: "Aminata",
  last_name: "Diallo",
  email: "aminata@example.com",
  phone: "+224600000000",
  company: "ACME",
  source: "campaign",
  campaign_id: "camp-1",
  status: "qualified",
  estimated_value_gnf: 500_000,
  notes: null,
  converted_client_id: null,
  converted_at: null,
  created_by: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  deleted_at: null,
};

type MarketingMockConfig = {
  lead?: Record<string, unknown> | null;
  existingClient?: { id: string } | null;
  insertClient?: QueryResult;
  updateLead?: QueryResult;
  campaignCount?: number;
};

function setupMarketingMocks(config: MarketingMockConfig) {
  const leadUpdates: unknown[] = [];
  const campaignUpdates: unknown[] = [];

  const server = {
    from: jest.fn((table: string) => {
      if (table === "leads") {
        const leadResult: QueryResult = {
          data: config.lead ?? null,
          error: config.lead ? null : null,
        };
        const builder = makeBuilder(leadResult);
        builder.update = jest.fn((payload: unknown) => {
          leadUpdates.push(payload);
          return makeBuilder(
            config.updateLead ?? { data: null, error: null },
          );
        });
        return builder;
      }
      if (table === "campaigns") {
        const read = makeBuilder({
          data: { conversion_count: config.campaignCount ?? 2 },
          error: null,
        });
        read.update = jest.fn((payload: unknown) => {
          campaignUpdates.push(payload);
          return makeBuilder({ data: null, error: null });
        });
        return read;
      }
      return makeBuilder({ data: null, error: null });
    }),
  };

  const admin = {
    from: jest.fn((table: string) => {
      if (table === "clients") {
        const dupBuilder = makeBuilder({
          data: config.existingClient ?? null,
          error: null,
        });
        dupBuilder.insert = jest.fn(() =>
          makeBuilder(
            config.insertClient ?? {
              data: { id: "client-new-1" },
              error: null,
            },
          ),
        );
        return dupBuilder;
      }
      return makeBuilder({ data: null, error: null });
    }),
  };

  mockServer.mockReturnValue(server);
  mockAdmin.mockReturnValue(admin);

  return { leadUpdates, campaignUpdates, server, admin };
}

describe("convertLeadToClient()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fail if lead not found", async () => {
    setupMarketingMocks({ lead: null });

    const result = await convertLeadToClient("missing-lead", "user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Lead introuvable.");
  });

  it("should fail if client with same email exists", async () => {
    setupMarketingMocks({
      lead: baseLead,
      existingClient: { id: "client-existing" },
    });

    const result = await convertLeadToClient("lead-1", "user-1");

    expect(result.success).toBe(false);
    expect(result.alreadyExists).toBe(true);
    expect(result.error).toContain("aminata@example.com");
    expect(result.error).toContain("existe déjà");
  });

  it("should create client if no duplicate", async () => {
    setupMarketingMocks({ lead: baseLead });

    const result = await convertLeadToClient("lead-1", "user-1");

    expect(result.success).toBe(true);
    expect(result.clientId).toBe("client-new-1");
  });

  it("should update lead conversion_count on campaign", async () => {
    const { campaignUpdates } = setupMarketingMocks({
      lead: baseLead,
      campaignCount: 4,
    });

    const result = await convertLeadToClient("lead-1", "user-1");

    expect(result.success).toBe(true);
    expect(campaignUpdates.some((p) => (p as { conversion_count?: number }).conversion_count === 5)).toBe(
      true,
    );
  });

  it("should not create client if INSERT fails", async () => {
    const { leadUpdates } = setupMarketingMocks({
      lead: baseLead,
      insertClient: { data: null, error: { message: "insert failed" } },
    });

    const result = await convertLeadToClient("lead-1", "user-1");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(leadUpdates).toHaveLength(0);
  });
});
