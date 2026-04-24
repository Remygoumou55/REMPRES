import { z } from "zod";

export const expensePaymentMethodSchema = z.enum(
  ["cash", "mobile_money", "bank_transfer", "other"],
  { error: "Mode de paiement invalide" },
);

export type ExpensePaymentMethod = z.infer<typeof expensePaymentMethodSchema>;

const common = {
  categoryId: z.string().uuid("Catégorie invalide"),
  amountGnf: z.coerce
    .number()
    .positive("Le montant doit être supérieur à 0")
    .max(999_999_999_999, "Montant trop élevé"),
  description: z
    .string()
    .min(1, "La description est obligatoire")
    .max(2000, "Description trop longue (max. 2 000 caractères)"),
  expenseDate: z.string().min(1, "La date est obligatoire"),
  paymentMethod: expensePaymentMethodSchema,
};

export const createExpenseFormSchema = z.object({ ...common });

export type CreateExpenseFormInput = z.infer<typeof createExpenseFormSchema>;

export const updateExpenseFormSchema = z.object({
  expenseId: z.string().uuid("Dépense invalide"),
  ...common,
  /** null/undefined = inchangé ; "" = retirer la pièce (via RPC) */
  receiptPath: z.string().max(2000).nullish(),
});

export type UpdateExpenseFormInput = z.infer<typeof updateExpenseFormSchema>;

export const expenseListFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

export type ExpenseListFilters = z.infer<typeof expenseListFiltersSchema>;
