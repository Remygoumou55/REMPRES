/**
 * lib/currencyService.ts
 *
 * Fonctions PURES — utilisables côté client ET serveur (aucun import serveur).
 * Conversion métier : RPC via `convertCurrency` (`@/lib/services/currencyService`) /
 * `convertCurrencyRpc` (`@/lib/currency/convertCurrencyRpc`). Rafraîchissement des taux
 * affichés / stock : `lib/server/currencyService.ts` et `/api/currency/refresh`.
 *
 * NOTE : `formatAmount` délègue à `formatMoney` de lib/utils/formatCurrency.ts
 * pour garantir un rendu 100 % identique entre l'UI et le PDF du reçu.
 */

import { formatMoney, type SupportedCurrency } from "@/lib/utils/formatCurrency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Currency = SupportedCurrency;
export type CurrencyRates = Record<string, number>;

// Taux de secours — valeurs indicatives avril 2026.
export const FALLBACK_RATES: CurrencyRates = {
  GNF: 1,
  XOF: 0.046,
  USD: 0.000116,
  EUR: 0.000107,
};

// ---------------------------------------------------------------------------
// 1. Formater un montant pour l'affichage
// ---------------------------------------------------------------------------

/**
 * Formate `alreadyConvertedAmount` dans la devise cible.
 *
 * ⚠️ Le montant doit être DÉJÀ converti (pas en GNF d'origine).
 *    Utiliser `convertCurrency` (RPC) via les hooks `useCurrencyConversion` /
 *    `useCurrencyBatchConversion` pour convertir avant formatage.
 *
 * Délègue à formatMoney() — rendu identique UI et PDF.
 *
 * | Devise | Exemple       |
 * |--------|---------------|
 * | GNF    | 10 000 GNF    |
 * | XOF    | 460 FCFA      |
 * | USD    | $1.16         |
 * | EUR    | 1,07 €        |
 */
export function formatAmount(
  alreadyConvertedAmount: number,
  currency: Currency,
): string {
  // Montant déjà converti → taux = 1 (pas de re-conversion)
  return formatMoney(alreadyConvertedAmount, currency, 1);
}

// ---------------------------------------------------------------------------
// 2. Obtenir le symbole d'une devise
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
