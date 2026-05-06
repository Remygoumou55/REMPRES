/**
 * lib/currencyService.ts
 *
 * Fonctions PURES — utilisables côté client ET serveur (aucun import serveur).
 * Conversion métier : couche unique `@/lib/currency/convertCurrency` (RPC interne).
 * Client : `@/lib/services/currencyService`. Serveur : `convert()` dans `lib/server/currencyService.ts`.
 * Rafraîchissement des taux : `lib/server/currencyService.ts` et `/api/currency/refresh`.
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
// Cache de facteurs GNF → devise (même signature de taux = même ligne mémoïsée)
// ---------------------------------------------------------------------------

const SUPPORTED: readonly Currency[] = ["GNF", "XOF", "USD", "EUR"];
const MAX_RATE_CACHE = 32;

/** Signature stable des taux (indépendante de l’identité d’objet). */
function ratesSignature(rates: CurrencyRates): string {
  return SUPPORTED.map((c) => String(rates[c] ?? "")).join("\u001f");
}

type MultiplierRow = Readonly<Record<Currency, number>>;

const multiplierBySignature = new Map<string, MultiplierRow>();

function buildMultiplierRow(rates: CurrencyRates): MultiplierRow {
  const row = {} as Record<Currency, number>;
  for (const c of SUPPORTED) {
    if (c === "GNF") {
      row[c] = 1;
    } else {
      const r = rates[c];
      row[c] = r != null && Number.isFinite(r) ? r : Number.NaN;
    }
  }
  return row;
}

/**
 * Facteurs de conversion GNF → chaque devise pour une table de taux donnée.
 * Mise en cache par **contenu** des taux : évite de recalculer / relire la map
 * à chaque ligne de panier ou chaque `convertGnfWithRates`.
 */
export function getCachedGnfMultipliers(rates: CurrencyRates): MultiplierRow {
  const sig = ratesSignature(rates);
  let row = multiplierBySignature.get(sig);
  if (row) return row;
  row = buildMultiplierRow(rates);
  multiplierBySignature.set(sig, row);
  if (multiplierBySignature.size > MAX_RATE_CACHE) {
    const first = multiplierBySignature.keys().next().value;
    if (first !== undefined) multiplierBySignature.delete(first);
  }
  return row;
}

/**
 * Conversion GNF → devise cible avec les taux locaux (Zustand / secours), sans appel réseau.
 * Utilisé pour un affichage panier instantané et cohérent avec `rates` persistés.
 */
export function convertGnfWithRates(
  amountGnf: number,
  to: Currency,
  rates: CurrencyRates,
): number {
  if (!Number.isFinite(amountGnf)) return Number.NaN;
  if (to === "GNF") {
    return Math.round(amountGnf * 100) / 100;
  }
  const r = getCachedGnfMultipliers(rates)[to];
  if (r == null || !Number.isFinite(r)) {
    return Number.NaN;
  }
  return amountGnf * r;
}

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
