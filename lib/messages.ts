/**
 * lib/messages.ts
 * Mapping centralisé des codes d'erreur backend → messages utilisateur en français.
 *
 * USAGE :
 *   import { resolveErrorMessage } from "@/lib/messages";
 *   setSubmitError(resolveErrorMessage(result.error));
 *
 * RÈGLE : jamais de jargon technique côté utilisateur.
 * Le backend renvoie le champ `detail` (déjà en français) ou le code `message`.
 * Cette fonction garantit un fallback propre dans tous les cas.
 */

// ---------------------------------------------------------------------------
// Codes d'erreur → messages utilisateur
// ---------------------------------------------------------------------------

export const ERROR_CODES: Record<string, string> = {
  // Validation panier
  EMPTY_ITEMS:          "Le panier ne peut pas être vide.",
  INVALID_ITEMS_FORMAT: "Format de commande invalide. Veuillez réessayer.",

  // Authentification
  MISSING_SELLER:       "Votre session a expiré. Veuillez vous reconnecter.",

  // Paiement
  INVALID_PAYMENT_METHOD: "Mode de paiement invalide.",

  // Remises
  INVALID_DISCOUNT:      "La remise globale doit être comprise entre 0 et 100 %.",
  INVALID_ITEM_DISCOUNT: "La remise d'un article doit être comprise entre 0 et 100 %.",

  // Articles
  INVALID_QUANTITY:  "La quantité doit être supérieure à 0.",
  INVALID_UNIT_PRICE: "Le prix unitaire doit être supérieur à 0 GNF.",

  // Stock
  INSUFFICIENT_STOCK:   "Stock insuffisant pour un ou plusieurs produits. Vérifiez les quantités.",
  NEGATIVE_STOCK_GUARD: "Erreur de stock critique. Contactez l'administrateur.",
  PRODUCT_NOT_FOUND:    "Un produit du panier est introuvable. Veuillez actualiser la page.",

  // Financier
  INVALID_SOURCE_TYPE: "Type de transaction financière invalide.",
  INVALID_AMOUNT:      "Le montant de la transaction doit être supérieur à 0.",

  // Générique
  TRANSACTION_FAILED:  "Impossible de finaliser l'action pour le moment. Veuillez réessayer.",

  // Client vente
  CLIENT_REQUIRED: "Veuillez sélectionner un client existant ou en créer un avant de valider la vente.",
};

// ---------------------------------------------------------------------------
// Messages de succès
// ---------------------------------------------------------------------------

export const SUCCESS_MESSAGES = {
  SALE_CREATED:       "Vente enregistrée avec succès.",
  PAYMENT_UPDATED:    "Statut de paiement mis à jour.",
  CLIENT_CREATED:     "Client créé avec succès.",
  CLIENT_UPDATED:     "Client mis à jour.",
  CLIENT_DELETED:     "Client supprimé.",
  PRODUCT_CREATED:    "Produit créé avec succès.",
  PRODUCT_UPDATED:    "Produit mis à jour.",
  PRODUCT_DELETED:    "Produit supprimé.",
} as const;

export const FEEDBACK_MESSAGES = {
  OPERATION_SUCCESS: "Opération réussie",
  OPERATION_FAILED: "Impossible d'executer l'action demandee.",
  GENERIC_ERROR: "Une anomalie inattendue est detectee.",
  LOADING: "Traitement en cours...",
  NO_DATA: "Aucune donnée disponible",
} as const;

const ERROR_PATTERNS = {
  network: [
    "NETWORK",
    "FETCH FAILED",
    "FAILED TO FETCH",
    "ETIMEDOUT",
    "ECONNRESET",
    "ECONNREFUSED",
    "TIMEOUT",
    "OFFLINE",
  ],
  auth: [
    "AUTH",
    "JWT",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NON AUTHENTIFIE",
    "SESSION",
    "INVALID TOKEN",
    "ACCESS DENIED",
    "PERMISSION",
  ],
  db: [
    "POSTGRES",
    "SQLSTATE",
    "DATABASE",
    "VIOLATES",
    "FOREIGN KEY",
    "UNIQUE CONSTRAINT",
    "DUPLICATE KEY",
    "P0001",
    "23505",
    "23503",
  ],
} as const;

function detectErrorKind(messageUpper: string): "network" | "auth" | "db" | null {
  if (ERROR_PATTERNS.network.some((p) => messageUpper.includes(p))) return "network";
  if (ERROR_PATTERNS.auth.some((p) => messageUpper.includes(p))) return "auth";
  if (ERROR_PATTERNS.db.some((p) => messageUpper.includes(p))) return "db";
  return null;
}

function contextualFallbackMessage(kind: "network" | "auth" | "db" | null, context?: string): string {
  const ctx = context?.trim() ? ` (${context.trim()})` : "";
  if (kind === "network") return `Connexion indisponible${ctx}. Verifiez internet puis reessayez.`;
  if (kind === "auth") return `Session invalide ou droits insuffisants${ctx}. Reconnectez-vous puis reessayez.`;
  if (kind === "db") return `Les donnees ne peuvent pas etre enregistrees${ctx}. Reessayez dans quelques instants.`;
  return context?.trim()
    ? `Action impossible${ctx}. Reessayez dans quelques instants.`
    : ERROR_CODES.TRANSACTION_FAILED;
}

// ---------------------------------------------------------------------------
// resolveErrorMessage — fonction principale
// ---------------------------------------------------------------------------

/**
 * Résout un message d'erreur backend en message utilisateur lisible.
 *
 * Priorité :
 * 1. Si le message contient un code connu (ex: "INSUFFICIENT_STOCK") → retourne le texte mappé
 * 2. Si le message ressemble à une phrase française (detail du SQL) → le retourne tel quel
 * 3. Sinon → message générique
 */
export function resolveErrorMessage(error: string | undefined | null): string {
  if (!error) return contextualFallbackMessage(null);

  const upper = error.toUpperCase();

  // 1. Correspondance exacte avec un code connu
  for (const [code, message] of Object.entries(ERROR_CODES)) {
    if (upper.includes(code)) {
      return message;
    }
  }

  // 2. Si le message SQL detail est déjà en français (phrase normale, pas un code)
  //    On le retourne directement — il est déjà lisible.
  const isCodeOnly = /^[A-Z][A-Z_]+$/.test(error.trim());
  if (!isCodeOnly && error.length > 5) {
    // Nettoyer les préfixes techniques éventuels
    return error
      .replace(/^P\d{4}:\s*/i, "")
      .replace(/^TRANSACTION_FAILED:\s*/i, "")
      .replace(/\(SQLSTATE\s+\w+\)/gi, "")
      .trim();
  }

  // 3. Fallback générique
  return contextualFallbackMessage(detectErrorKind(upper));
}

/**
 * Variante contextuelle pour afficher des messages plus précis selon l'écran/action.
 */
export function resolveErrorMessageWithContext(
  error: string | undefined | null,
  context: string,
): string {
  if (error) {
    const resolved = resolveErrorMessage(error);
    if (resolved !== ERROR_CODES.TRANSACTION_FAILED) return resolved;
  }
  const upper = (error ?? "").toUpperCase();
  return contextualFallbackMessage(detectErrorKind(upper), context);
}

/**
 * Convertit une erreur inconnue (throw JS / Promise rejetée) en message utilisateur.
 */
export function resolveUnknownErrorMessage(error: unknown): string {
  if (typeof error === "string") return resolveErrorMessage(error);
  if (error instanceof Error) return resolveErrorMessage(error.message);
  return contextualFallbackMessage(null);
}
