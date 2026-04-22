import { z } from "zod";

// Convertit une chaîne vide en null avant validation (champs optionnels de formulaire)
const emptyToNull = (val: unknown) => (val === "" ? null : val);

export const createProductSchema = z.object({
  sku: z.string().trim().min(2, "SKU requis (min 2 caractères)").max(64, "SKU trop long (max 64)"),
  name: z.string().trim().min(2, "Nom requis (min 2 caractères)").max(200, "Nom trop long (max 200)"),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().max(2000, "Description trop longue (max 2 000 caractères)").nullable().optional(),
  ),
  image_url: z.preprocess(
    emptyToNull,
    z.string().url("URL d'image invalide").nullable().optional(),
  ),
  unit: z.string().trim().min(1, "Unité requise").max(30, "Unité trop longue").default("unite"),
  price_gnf: z.coerce.number().min(0, "Le prix ne peut pas être négatif"),
  stock_quantity: z.coerce.number().int("Doit être un entier").min(0, "Le stock ne peut pas être négatif"),
  stock_threshold: z.coerce.number().int("Doit être un entier").min(0, "Le seuil ne peut pas être négatif").default(5),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.extend({
  id: z.string().uuid("ID produit invalide"),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
