jest.mock("@/lib/supabaseServer", () => ({
  getSupabaseServerClient: jest.fn(),
}));

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { receivePurchaseOrder } from "@/lib/server/purchase-orders";

const mockSupabase = getSupabaseServerClient as jest.Mock;

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

function createPurchaseOrderSupabase(config: {
  order: Record<string, unknown> | null;
  items?: Record<string, unknown>[];
  insertError?: boolean;
  updateError?: boolean;
}) {
  return {
    from: jest.fn((table: string) => {
      if (table === "purchase_orders") {
        const readResult: QueryResult = config.order
          ? { data: config.order, error: null }
          : { data: null, error: { message: "Not found" } };
        const builder = makeBuilder(readResult);
        builder.update = jest.fn(() =>
          makeBuilder(
            config.updateError
              ? { data: null, error: { message: "update failed" } }
              : { data: null, error: null },
          ),
        );
        return builder;
      }
      if (table === "purchase_order_items") {
        return makeBuilder({ data: config.items ?? [], error: null });
      }
      if (table === "stock_movements_logistique") {
        return makeBuilder(
          config.insertError
            ? { data: null, error: { message: "insert failed" } }
            : { data: null, error: null },
        );
      }
      return makeBuilder({ data: null, error: null });
    }),
  };
}

const baseOrder = {
  id: "order-1",
  order_number: "CMD-1001",
  supplier_name: "Fournisseur Test",
  supplier_contact: null,
  expected_delivery_date: null,
  received_at: null,
  total_gnf: 10_000,
  notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  created_by: "user-creator",
};

const baseItem = {
  id: "item-1",
  stock_item_id: "stock-1",
  product_name: "Produit Test",
  quantity_ordered: 10,
  quantity_received: 0,
  unit_price_gnf: 1_000,
  total_gnf: 10_000,
};

describe("receivePurchaseOrder()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return error if order not found", async () => {
    mockSupabase.mockReturnValue(createPurchaseOrderSupabase({ order: null }));

    const result = await receivePurchaseOrder("non-existent-id", "user-123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Commande introuvable.");
  });

  it("should return error if order is not confirmed", async () => {
    mockSupabase.mockReturnValue(
      createPurchaseOrderSupabase({
        order: { ...baseOrder, status: "pending" },
        items: [baseItem],
      }),
    );

    const result = await receivePurchaseOrder("order-1", "user-123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Transition invalide.");
  });

  it("should not double-receive an order", async () => {
    mockSupabase.mockReturnValue(
      createPurchaseOrderSupabase({
        order: { ...baseOrder, status: "received" },
        items: [baseItem],
      }),
    );

    const result = await receivePurchaseOrder("order-1", "user-123");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Transition invalide.");
  });

  it("should succeed for a confirmed order", async () => {
    const client = createPurchaseOrderSupabase({
      order: { ...baseOrder, status: "confirmed" },
      items: [baseItem],
    });
    mockSupabase.mockReturnValue(client);

    const result = await receivePurchaseOrder("order-1", "user-123");

    expect(result.success).toBe(true);
    expect(client.from).toHaveBeenCalledWith("stock_movements_logistique");
    expect(client.from).toHaveBeenCalledWith("purchase_orders");
  });
});
