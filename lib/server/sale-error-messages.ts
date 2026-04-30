/**
 * Messages utilisateur pour les erreurs liées aux ventes (archivage / suppression).
 */
export function mapArchiveSaleError(message: string | undefined, fallback: string): string {
  const raw = (message ?? "").toLowerCase();

  if (!raw.trim()) return fallback;

  if (raw.includes("non authentifié") || raw.includes("not authenticated")) {
    return "Non authentifié.";
  }

  if (raw.includes("accès refusé") || raw.includes("acces refuse") || raw.includes("access denied")) {
    return "Accès refusé: vous n'avez pas la permission pour cette action.";
  }

  if (raw.includes("introuvable") || raw.includes("déjà supprimée") || raw.includes("deja supprimee")) {
    return "Vente introuvable ou déjà supprimée.";
  }

  if (raw.includes("duplicate key") || raw.includes("unique") || raw.includes("already exists")) {
    return "Cette vente a déjà été archivée.";
  }

  if (raw.includes("could not find") && raw.includes("function")) {
    return "Archivage indisponible: exécutez la migration SQL sales_archive sur Supabase.";
  }

  return message?.trim() || fallback;
}
