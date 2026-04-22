import { z } from "zod";

// ---------------------------------------------------------------------------
// SaleItem (ligne de vente)
// ---------------------------------------------------------------------------

export const saleItemSchema = z.object({
  productId: z.string().uuid("Identifiant produit invalide"),
  productName: z
    .string()
    .min(1, "Le nom du produit ne peut pas être vide")
    .max(200, "Le nom du produit est trop long (max 200 caractères)"),
  productSku: z.string().max(50, "Le SKU est trop long (max 50 caractères)").nullable().optional(),
  quantity: z.coerce.number().int("Doit être un entier").positive("Doit être supérieur à 0"),
  unitPriceGNF: z.coerce.number().positive("Le prix unitaire doit être supérieur à 0"),
  discountPercent: z.coerce.number().min(0, "Minimum 0 %").max(100, "Maximum 100 %").default(0),
});

export type SaleItem = z.infer<typeof saleItemSchema>;

// ---------------------------------------------------------------------------
// CreateSaleInput
// ---------------------------------------------------------------------------

export const createSaleSchema = z
  .object({
    clientId: z.string().uuid("Identifiant client invalide").nullable().optional(),
    items: z.array(saleItemSchema).min(1, "La vente doit contenir au moins un article"),
    discountPercent: z.coerce.number().min(0, "Minimum 0 %").max(100, "Maximum 100 %").default(0),
    paymentMethod: z.enum([
      "cash",
      "mobile_money",
      "bank_transfer",
    ], { error: "Mode de paiement invalide. Valeurs acceptées : cash, mobile_money, bank_transfer" }),
    displayCurrency: z.enum(["GNF", "XOF", "USD", "EUR"], {
      error: "Devise invalide (GNF, XOF, USD, EUR)",
    }),
    exchangeRate: z.coerce.number().positive("Le taux de change doit être positif").default(1),
    notes: z
      .string()
      .max(2000, "Les notes ne peuvent pas dépasser 2 000 caractères")
      .nullable()
      .optional(),
    sellerId: z.string().uuid("Identifiant vendeur invalide"),
  })
  .superRefine((data, ctx) => {
    data.items.forEach((item, index) => {
      if (item.unitPriceGNF <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "unitPriceGNF"],
          message: `Le prix unitaire de "${item.productName}" doit être supérieur à 0`,
        });
      }
    });
  });

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

// ---------------------------------------------------------------------------
// UpdatePaymentStatus
// ---------------------------------------------------------------------------

export const updatePaymentStatusSchema = z.object({
  saleId: z.string().uuid("Identifiant de vente invalide"),
  newStatus: z.enum(
    ["pending", "partial", "paid", "overdue", "cancelled"],
    { error: "Statut invalide" },
  ),
  amountPaid: z.coerce.number().min(0, "Le montant payé ne peut pas être négatif"),
});

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;

// ---------------------------------------------------------------------------
// SaleListParams
// ---------------------------------------------------------------------------

export const saleListParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z
    .union([z.literal(10), z.literal(25), z.literal(50)])
    .default(10),
  search: z.string().optional(),
  paymentStatus: z
    .enum(["pending", "partial", "paid", "overdue", "cancelled"])
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

/** Type de sortie (après parsing, page/pageSize sont toujours définis). */
export type SaleListParams = z.infer<typeof saleListParamsSchema>;
/** Type d'entrée : page/pageSize sont optionnels car ils ont des valeurs par défaut. */
export type SaleListParamsInput = z.input<typeof saleListParamsSchema>;
