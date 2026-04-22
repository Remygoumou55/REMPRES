import { z } from "zod";

const normalizeText = (value?: string | null) => {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeEmail = (value: unknown) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

const optionalTextField = z.preprocess((value) => normalizeText(value as string | null | undefined), z.string().nullable());
const optionalEmailField = z.preprocess(normalizeEmail, z.string().email("Email invalide").nullable());

export const clientBaseSchema = z
  .object({
    client_type: z.enum(["individual", "company"]),
    first_name: optionalTextField,
    last_name: optionalTextField,
    company_name: optionalTextField,
    email: optionalEmailField,
    phone: optionalTextField,
    address: optionalTextField,
    city: optionalTextField,
    country: optionalTextField,
    notes: optionalTextField,
  })
  .superRefine((data, ctx) => {
    if (data.client_type === "individual") {
      if (!data.first_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["first_name"],
          message: "Le prénom est requis pour un client individuel",
        });
      }
      if (!data.last_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["last_name"],
          message: "Le nom est requis pour un client individuel",
        });
      }
    }

    if (data.client_type === "company") {
      if (!data.company_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["company_name"],
          message: "Le nom de l'entreprise est requis pour un client entreprise",
        });
      }
    }
  });

export const createClientSchema = clientBaseSchema;

export const updateClientSchema = clientBaseSchema.extend({
  id: z.string().uuid("ID client invalide"),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
