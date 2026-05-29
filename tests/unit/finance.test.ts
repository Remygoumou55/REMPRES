jest.mock("@/lib/supabaseServer", () => ({
  getSupabaseServerClient: jest.fn(),
}));

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { computeSystemBalance } from "@/lib/server/bank-reconciliation";

const mockSupabase = getSupabaseServerClient as jest.Mock;

/** Mirrors finance-monthly-report margin_pct logic (pure). */
function computeMarginPct(totalRevenue: number, netGnf: number): number {
  return totalRevenue > 0 ? Math.round((netGnf / totalRevenue) * 1000) / 10 : 0;
}

function balanceFromRows(
  sales: Array<{
    total_amount_gnf: number;
    lifecycle_status?: string;
    payment_status?: string;
  }>,
  expenses: Array<{ amount_gnf: number }>,
  ft: Array<{ amount_gnf: number; source_type: string; status: string }> = [],
): number {
  const salesRevenue = sales
    .filter(
      (s) =>
        s.lifecycle_status === "validated" ||
        s.payment_status === "paid" ||
        s.payment_status === "partial",
    )
    .reduce((sum, s) => sum + s.total_amount_gnf, 0);
  const otherRevenue = ft
    .filter((t) => t.status !== "cancelled")
    .reduce((sum, t) => sum + t.amount_gnf, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount_gnf, 0);
  return Math.round(salesRevenue + otherRevenue - totalExpenses);
}

function mockBalanceQueries(
  sales: unknown[],
  expenses: unknown[],
  ft: unknown[] = [],
) {
  mockSupabase.mockReturnValue({
    from: jest.fn((table: string) => {
      const result = { data: [] as unknown[], error: null };
      if (table === "sales") result.data = sales;
      if (table === "expenses") result.data = expenses;
      if (table === "financial_transactions") result.data = ft;
      const chain = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        then: (resolve: (v: typeof result) => void) => Promise.resolve(result).then(resolve),
      };
      return chain;
    }),
  });
}

describe("Financial calculations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Balance computation (computeSystemBalance)", () => {
    it("should return 0 when no transactions", async () => {
      mockBalanceQueries([], [], []);
      const balance = await computeSystemBalance(5, 2026);
      expect(balance).toBe(0);
      expect(Number.isNaN(balance)).toBe(false);
    });

    it("should handle revenues minus expenses", async () => {
      mockBalanceQueries(
        [{ total_amount_gnf: 1_000_000, lifecycle_status: "validated", payment_status: "paid" }],
        [{ amount_gnf: 300_000 }],
        [],
      );
      const balance = await computeSystemBalance(5, 2026);
      expect(balance).toBe(700_000);
    });

    it("should not return NaN for empty data", async () => {
      mockBalanceQueries([], [], []);
      const balance = await computeSystemBalance(1, 2026);
      expect(Number.isNaN(balance)).toBe(false);
      expect(balance).toBe(0);
    });

    it("should handle negative balance correctly", async () => {
      mockBalanceQueries(
        [{ total_amount_gnf: 200_000, lifecycle_status: "validated", payment_status: "paid" }],
        [{ amount_gnf: 500_000 }],
        [],
      );
      const balance = await computeSystemBalance(3, 2026);
      expect(balance).toBeLessThan(0);
      expect(balance).toBe(-300_000);
    });
  });

  describe("Margin calculation (report formula)", () => {
    it("should return 0% margin when revenue is 0", () => {
      expect(computeMarginPct(0, 0)).toBe(0);
      expect(Number.isNaN(computeMarginPct(0, -100))).toBe(false);
    });

    it("should calculate correct margin percentage", () => {
      const revenue = 1_000;
      const net = 400;
      expect(computeMarginPct(revenue, net)).toBe(40);
    });

    it("should match pure balance helper for sample rows", () => {
      const balance = balanceFromRows(
        [{ total_amount_gnf: 1_000_000, lifecycle_status: "validated" }],
        [{ amount_gnf: 250_000 }],
      );
      expect(balance).toBe(750_000);
      expect(computeMarginPct(1_000_000, balance)).toBe(75);
    });
  });
});
