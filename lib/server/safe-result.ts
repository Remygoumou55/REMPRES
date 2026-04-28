/**
 * lib/server/safe-result.ts
 *
 * Modèle de résultat unique pour les chemins serveur (Server Actions, Route Handlers,
 * lib/server/*) : éviter throw vers l’appelant quand une erreur métier est attendue.
 *
 * Bonnes pratiques :
 * - Journaliser (logError / logWarning) avant de retourner err() pour le debug prod.
 * - Les fonctions existantes qui renvoient d’autres formes ({ success, userId }, etc.)
 *   peuvent migrer progressivement vers { success: true, data: … } sans casser l’API.
 */

export type SafeResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Succès typé — préférer à l’objet littéral pour garder un seul pattern. */
export function ok<T>(data: T): SafeResult<T> {
  return { success: true, data };
}

/**
 * Échec typé. Assignable à SafeResult<T> pour tout T (aucune donnée en cas d’erreur).
 * Toujours coupler à un log structuré en amont ou dans le catch.
 */
export function err(error: string): { success: false; error: string } {
  return { success: false, error };
}
