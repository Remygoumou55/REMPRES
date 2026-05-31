jest.mock("@/lib/supabaseServer", () => ({
  getSupabaseServerClient: jest.fn(),
}));

jest.mock("@/lib/server/sales", () => ({
  createSale: jest.fn(),
}));

jest.mock("@/lib/logger", () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
}));

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createSale } from "@/lib/server/sales";
import { logError } from "@/lib/logger";
import {
  convertQuoteToSale,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TRANSITIONS,
} from "@/lib/server/quotes";

const mockSupabase = getSupabaseServerClient as jest.Mock;
const mockCreateSale = createSale as jest.Mock;

type QueryResult = { data: unknown; error: { message: string } | null };

function makeBuilder(result: QueryResult) {
  const builder: Record<string, jest.Mock> = {
    select: jest.fn(),
    eq: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    order: jest.fn(),
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
    get: () => (resolve: (v: QueryResult) => unknown) =>
      Promise.resolve(result).then(resolve),
    configurable: true,
  });
  return builder;
}

function createQuoteConversionSupabase(config: {
  quote: Record<string, unknown> | null;
  items?: Record<string, unknown>[];
  products?: Array<{ id: string; sku: string | null }>;
  updateError?: boolean;
  trackUpdate?: { called: boolean };
}) {
  return {
    from: jest.fn((table: string) => {
      if (table === "quotes") {
        const readResult: QueryResult = config.quote
          ? { data: config.quote, error: null }
          : { data: null, error: null };
        const builder = makeBuilder(readResult);
        builder.maybeSingle = jest.fn().mockResolvedValue(readResult);
        builder.update = jest.fn(() => {
          if (config.trackUpdate) {
            config.trackUpdate.called = true;
          }
          return makeBuilder(
            config.updateError
              ? { data: null, error: { message: "update failed" } }
              : { data: null, error: null },
          );
        });
        return builder;
      }
      if (table === "quote_items") {
        return makeBuilder({ data: config.items ?? [], error: null });
      }
      if (table === "products") {
        return makeBuilder({ data: config.products ?? [], error: null });
      }
      return makeBuilder({ data: null, error: null });
    }),
  };
}

const baseQuoteRow = {
  id: "quote-001",
  quote_number: "DV-1001",
  client_id: "client-001",
  client_name: "Mamadou Bah",
  client_email: null,
  client_phone: null,
  status: "accepted",
  valid_until: null,
  subtotal_gnf: 1_000_000,
  discount_gnf: 0,
  total_gnf: 900_000,
  converted_to_sale_id: null,
  converted_at: null,
  notes: null,
  payment_conditions: null,
  sent_at: null,
  accepted_at: "2026-01-01T00:00:00.000Z",
  refused_at: null,
  refused_reason: null,
  created_by: "user-001",
  created_at: "2026-01-01T00:00:00.000Z",
};

const MOCK_ITEMS = [
  {
    id: "item-001",
    quote_id: "quote-001",
    product_id: "product-001",
    product_name: "Formation Excel",
    description: null,
    quantity: 2,
    unit_price_gnf: 500_000,
    discount_pct: 10,
    line_total_gnf: 900_000,
    position: 0,
  },
];

const MOCK_PRODUCTS = [{ id: "product-001", sku: "FORM-EXCEL" }];

describe("convertQuoteToSale()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if quote not found", async () => {
    mockSupabase.mockReturnValue(
      createQuoteConversionSupabase({ quote: null }),
    );

    const result = await convertQuoteToSale("non-existent-id", "user-001");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/introuvable/i);
  });

  it("should return error if quote is not accepted", async () => {
    mockSupabase.mockReturnValue(
      createQuoteConversionSupabase({
        quote: { ...baseQuoteRow, status: "draft" },
        items: MOCK_ITEMS,
      }),
    );

    const result = await convertQuoteToSale("quote-001", "user-001");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/accept|statut/i);
  });

  it("should return error for sent status too", async () => {
    mockSupabase.mockReturnValue(
      createQuoteConversionSupabase({
        quote: { ...baseQuoteRow, status: "sent" },
        items: MOCK_ITEMS,
      }),
    );

    const result = await convertQuoteToSale("quote-001", "user-001");

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/accept|statut/i);
  });

  it("should return error if quote already converted", async () => {
    mockSupabase.mockReturnValue(
      createQuoteConversionSupabase({
        quote: {
          ...baseQuoteRow,
          status: "accepted",
          converted_to_sale_id: "sale-existing-001",
        },
        items: MOCK_ITEMS,
      }),
    );

    const result = await convertQuoteToSale("quote-001", "user-001");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toMatch(/déjà|converti|already/i);
  });

  it("should not mark quote as converted if sale creation fails", async () => {
    const trackUpdate = { called: false };
    mockSupabase.mockReturnValue(
      createQuoteConversionSupabase({
        quote: baseQuoteRow,
        items: MOCK_ITEMS,
        products: MOCK_PRODUCTS,
        trackUpdate,
      }),
    );
    mockCreateSale.mockRejectedValue(new Error("Insufficient stock"));

    const result = await convertQuoteToSale("quote-001", "user-001");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Insufficient stock");
    expect(trackUpdate.called).toBe(false);
    expect(mockCreateSale).toHaveBeenCalledTimes(1);
  });

  it("should create sale and mark quote as converted on success", async () => {
    const NEW_SALE_ID = "sale-new-001";
    const trackUpdate = { called: false };
    const client = createQuoteConversionSupabase({
      quote: baseQuoteRow,
      items: MOCK_ITEMS,
      products: MOCK_PRODUCTS,
      trackUpdate,
    });
    mockSupabase.mockReturnValue(client);
    mockCreateSale.mockResolvedValue({ id: NEW_SALE_ID });

    const result = await convertQuoteToSale("quote-001", "user-001");

    expect(result.success).toBe(true);
    expect(result.saleId).toBe(NEW_SALE_ID);
    expect(mockCreateSale).toHaveBeenCalledTimes(1);
    expect(trackUpdate.called).toBe(true);
    expect(client.from).toHaveBeenCalledWith("quotes");
    expect(client.from).toHaveBeenCalledWith("quote_items");
    expect(client.from).toHaveBeenCalledWith("products");

    const createSaleArg = mockCreateSale.mock.calls[0][0];
    expect(createSaleArg.clientId).toBe("client-001");
    expect(createSaleArg.notes).toContain("Converti depuis devis DV-1001");
    expect(createSaleArg.items).toHaveLength(1);
    expect(createSaleArg.items[0].productId).toBe("product-001");
  });

  it("should return success even if quote update fails after sale creation", async () => {
    const NEW_SALE_ID = "sale-new-001";
    mockSupabase.mockReturnValue(
      createQuoteConversionSupabase({
        quote: baseQuoteRow,
        items: MOCK_ITEMS,
        products: MOCK_PRODUCTS,
        updateError: true,
      }),
    );
    mockCreateSale.mockResolvedValue({ id: NEW_SALE_ID });

    const result = await convertQuoteToSale("quote-001", "user-001");

    expect(result.success).toBe(true);
    expect(result.saleId).toBe(NEW_SALE_ID);
    expect(logError).toHaveBeenCalledWith(
      "quotes",
      "quote converted but status update failed",
      expect.objectContaining({
        quoteId: "quote-001",
        saleId: NEW_SALE_ID,
        userId: "user-001",
      }),
    );
  });
});

describe("QUOTE_STATUS_TRANSITIONS", () => {
  it("should define draft transitions correctly", () => {
    const allowed = QUOTE_STATUS_TRANSITIONS.draft;
    expect(allowed).toContain("sent");
    expect(allowed).toContain("refused");
    expect(allowed).not.toContain("converted");
    expect(allowed).not.toContain("expired");
  });

  it("should define sent transitions correctly", () => {
    const allowed = QUOTE_STATUS_TRANSITIONS.sent;
    expect(allowed).toContain("accepted");
    expect(allowed).toContain("refused");
    expect(allowed).toContain("expired");
    expect(allowed).not.toContain("converted");
  });

  it("should only allow conversion from accepted", () => {
    const allowed = QUOTE_STATUS_TRANSITIONS.accepted;
    expect(allowed).toContain("converted");
    expect(allowed).toHaveLength(1);
  });

  it("should have no transitions for terminal states", () => {
    expect(QUOTE_STATUS_TRANSITIONS.refused).toHaveLength(0);
    expect(QUOTE_STATUS_TRANSITIONS.expired).toHaveLength(0);
    expect(QUOTE_STATUS_TRANSITIONS.converted).toHaveLength(0);
  });
});

describe("QUOTE_STATUS_LABELS", () => {
  it("should have labels for all 6 statuses", () => {
    const statuses = [
      "draft",
      "sent",
      "accepted",
      "refused",
      "expired",
      "converted",
    ] as const;
    for (const status of statuses) {
      expect(QUOTE_STATUS_LABELS[status]).toBeDefined();
      expect(typeof QUOTE_STATUS_LABELS[status]).toBe("string");
      expect(QUOTE_STATUS_LABELS[status].length).toBeGreaterThan(0);
    }
  });
});
