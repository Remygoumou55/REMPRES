import { ZodError } from "zod";

export function mapProductError(error: unknown, fallbackMessage: string): string {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    return firstIssue?.message ?? fallbackMessage;
  }

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const raw = error.message.toLowerCase();

  if (raw.includes("accès refusé") || raw.includes("acces refuse")) {
    return "Accès refusé: vous n'avez pas la permission pour cette action.";
  }

  if (raw.includes("id produit invalide")) {
    return "Le produit sélectionné est invalide.";
  }

  if (raw.includes("duplicate key") || raw.includes("already exists") || raw.includes("unique")) {
    return "Un produit avec ce SKU existe déjà.";
  }

  if (raw.includes("permission denied")) {
    return "Action refusée par la sécurité de la base de données.";
  }

  return error.message || fallbackMessage;
}

