/**
 * lib/currencyService.ts
 *
 * Fonctions PURES — utilisables côté client ET serveur (aucun import serveur).
 * Les fonctions nécessitant Supabase sont dans lib/server/currencyService.ts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Currency = "GNF" | "XOF" | "USD" | "EUR";
export type CurrencyRates = Record<string, number>;

// Taux de secours — valeurs indicatives avril 2026.
export const FALLBACK_RATES: CurrencyRates = {
  GNF: 1,
  XOF: 0.046,
  USD: 0.000116,
  EUR: 0.000107,
};

// ---------------------------------------------------------------------------
// 1. Convertir un montant depuis GNF
// ---------------------------------------------------------------------------

/**
 * Convertit `amountGNF` vers `toCurrency` en utilisant les taux fournis.
 * Les taux sont exprimés en "unités de devise par 1 GNF".
 *
 * @example convertAmount(10000, 'USD', { GNF: 1, USD: 0.000116 }) → 1.16
 */
export function convertAmount(
  amountGNF: number,
  toCurrency: Currency,
  rates: CurrencyRates,
): number {
  if (toCurrency === "GNF") return Math.round(amountGNF * 100) / 100;

  const rate = rates[toCurrency];
  if (!rate || rate <= 0) return 0;

  return Math.round(amountGNF * rate * 100) / 100;
}

// ---------------------------------------------------------------------------
// 2. Formater un montant pour l'affichage
// ---------------------------------------------------------------------------

/**
 * Formate `amount` dans la devise cible selon les conventions locales RemPres.
 *
 * | Devise | Exemple    |
 * |--------|------------|
 * | GNF    | 10 000 GNF |
 * | XOF    | 460 FCFA   |
 * | USD    | $1.16      |
 * | EUR    | 1,07 €     |
 */
export function formatAmount(amount: number, currency: Currency): string {
  switch (currency) {
    case "GNF":
    case "XOF": {
      const rounded = Math.round(amount);
      const formatted = rounded.toLocaleString("fr-FR", { useGrouping: true });
      const symbol = currency === "GNF" ? "GNF" : "FCFA";
      return `${formatted}\u202F${symbol}`;
    }
    case "USD":
      return `$${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    case "EUR":
      return `${amount.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}\u202F€`;
    default:
      return `${amount} ${currency}`;
  }
}

// ---------------------------------------------------------------------------
// 3. Obtenir le symbole d'une devise
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GNF: "GNF",
  XOF: "FCFA",
  USD: "$",
  EUR: "€",
};

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}
