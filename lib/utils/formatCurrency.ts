/**
 * lib/utils/formatCurrency.ts
 * Utilitaires de formatage monétaire pour RemPres.
 * Utilisé dans le PDF, l'UI et les exports.
 *
 * RÈGLE MÉTIER : tous les montants sont STOCKÉS en GNF.
 * L'affichage peut être converti dans d'autres devises (XOF, USD, EUR).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupportedCurrency = "GNF" | "XOF" | "USD" | "EUR";

// ---------------------------------------------------------------------------
// Formatage GNF (devise de base, espace comme séparateur de milliers)
// ---------------------------------------------------------------------------

/**
 * Formate un montant en GNF avec séparateurs de milliers français.
 * Ex: formatGNF(1500000) → "1 500 000 GNF"
 */
export function formatGNF(amount: number): string {
  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount)) + " GNF"
  );
}

// ---------------------------------------------------------------------------
// Formatage par devise
// ---------------------------------------------------------------------------

/**
 * Formate un montant selon la devise cible.
 *
 * @param amount    Montant (déjà converti dans la devise cible)
 * @param currency  Devise de destination
 *
 * Ex:
 *   formatByCurrency(1500000, "GNF") → "1 500 000 GNF"
 *   formatByCurrency(690, "XOF")     → "690 FCFA"
 *   formatByCurrency(174, "USD")     → "$174.00"
 *   formatByCurrency(161, "EUR")     → "161,00 €"
 */
export function formatByCurrency(amount: number, currency: SupportedCurrency): string {
  switch (currency) {
    case "GNF":
      return formatGNF(amount);

    case "XOF":
      return (
        new Intl.NumberFormat("fr-FR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(Math.round(amount)) + " FCFA"
      );

    case "USD":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);

    case "EUR":
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);

    default:
      return `${amount} ${currency}`;
  }
}

// ---------------------------------------------------------------------------
// Formatage compact (pour les KPIs dashboard)
// ---------------------------------------------------------------------------

/**
 * Formate un montant GNF en version courte pour les KPIs.
 * Ex:
 *   compactGNF(1500000)    → "1,5M GNF"
 *   compactGNF(850000)     → "850K GNF"
 *   compactGNF(5000)       → "5 000 GNF"
 */
export function compactGNF(amount: number): string {
  if (amount >= 1_000_000) {
    return (
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(amount / 1_000_000) + "M GNF"
    );
  }
  if (amount >= 1_000) {
    return (
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(amount / 1_000) + "K GNF"
    );
  }
  return formatGNF(amount);
}

// ---------------------------------------------------------------------------
// Symbole de devise
// ---------------------------------------------------------------------------

export function getCurrencySymbol(currency: SupportedCurrency): string {
  const symbols: Record<SupportedCurrency, string> = {
    GNF: "GNF",
    XOF: "FCFA",
    USD: "$",
    EUR: "€",
  };
  return symbols[currency];
}
