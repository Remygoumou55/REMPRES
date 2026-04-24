import { describe, expect, it } from "vitest";
import { createExpenseFormSchema } from "./expense";

describe("createExpenseFormSchema", () => {
  it("valide un formulaire complet", () => {
    const out = createExpenseFormSchema.parse({
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
      amountGnf: 1000,
      description: "Test",
      expenseDate: "2024-01-10",
      paymentMethod: "cash",
    });
    expect(out.amountGnf).toBe(1000);
  });
});
