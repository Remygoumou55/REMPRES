/**
 * lib/utils/formatCurrency.ts
 *
 * RÈGLE — SOURCE DE VÉRITÉ UNIQUE pour le formatage monétaire dans RemPres.
 *
 * ► Utiliser `formatMoney(amountGNF, currency, exchangeRate)` partout :
 *     UI web, PDF @react-pdf/renderer, exports, emails…
 *
 * Le format produit est identique sur tous les supports :
 *   - Séparateur de milliers : espace fine insécable (\u202F) → HTML/Web
 *                              espace insécable (\u00A0)      → PDF (Helvetica Latin-1)
 *   - Symbole collé au nombre avec \u202F ou \u00A0 pour éviter les sauts de ligne
 *
 * Les fonctions legacy (formatGNF, formatByCurrency, compactGNF)
 * sont conservées pour rétrocompatibilité — elles délèguent toutes à formatMoney.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SupportedCurrency = "GNF" | "XOF" | "USD" | "EUR";

// ---------------------------------------------------------------------------
// Helpers internes
// ---------------------------------------------------------------------------

/**
 * Insère des espaces (insécables) comme séparateurs de milliers.
 * Utilise \u00A0 (non-breaking space Latin-1) : compatible web ET PDF.
 */
function groupThousands(n: number): string {
  return Math.floor(Math.abs(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

// ---------------------------------------------------------------------------
// formatMoney — FONCTION CANONIQUE
// ---------------------------------------------------------------------------

/**
 * Formate un montant GNF dans la devise d'affichage souhaitée.
 *
 * @param amountGNF    Montant brut en Franc Guinéen (stocké en base)
 * @param currency     Devise d'affichage (GNF | XOF | USD | EUR)
 * @param exchangeRate Taux de conversion GNF→currency (ex: 0.000116 pour USD)
 *                     Ignoré si currency === "GNF"
 *
 * @example
 *   formatMoney(1_500_000, "GNF")                  → "1 500 000\u00A0GNF"
 *   formatMoney(1_500_000, "XOF", 0.046)           → "69 000\u00A0FCFA"
 *   formatMoney(1_500_000, "USD", 0.000116)         → "$174.00"
 *   formatMoney(1_500_000, "EUR", 0.000107)         → "160,50\u00A0€"
 */
export function formatMoney(
  amountGNF: number,
  currency: SupportedCurrency = "GNF",
  exchangeRate: number = 1,
): string {
  const converted =
    currency === "GNF"
      ? Math.round(amountGNF)
      : Math.round(amountGNF * exchangeRate * 100) / 100;

  switch (currency) {
    case "GNF": {
      return groupThousands(converted) + "\u00A0GNF";
    }

    case "XOF": {
      return groupThousands(converted) + "\u00A0FCFA";
    }

    case "USD": {
      const abs = Math.abs(converted);
      const [intPart, decPart = "00"] = abs.toFixed(2).split(".");
      const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return (converted < 0 ? "-$" : "$") + intFormatted + "." + decPart;
    }

    case "EUR": {
      const abs = Math.abs(converted);
      const [intPart, decPart = "00"] = abs.toFixed(2).split(".");
      const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
      return (converted < 0 ? "-" : "") + intFormatted + "," + decPart + "\u00A0€";
    }

    default:
      return `${converted} ${currency}`;
  }
}

// ---------------------------------------------------------------------------
// formatGNF — alias rétrocompat (toujours en GNF, pas de conversion)
// ---------------------------------------------------------------------------

/**
 * Formate un montant GNF.
 * Ex: formatGNF(1_500_000) → "1 500 000 GNF"
 */
export function formatGNF(amount: number): string {
  return formatMoney(amount, "GNF", 1);
}

// ---------------------------------------------------------------------------
// formatByCurrency — montant DÉJÀ converti dans la devise cible
// ---------------------------------------------------------------------------

/**
 * Formate un montant qui est DÉJÀ dans la devise cible (pas de conversion).
 * Utilisé quand la conversion a été faite en amont.
 *
 * Ex: formatByCurrency(690, "XOF") → "690 FCFA"
 */
export function formatByCurrency(
  alreadyConvertedAmount: number,
  currency: SupportedCurrency,
): string {
  return formatMoney(alreadyConvertedAmount, currency, 1);
}

// ---------------------------------------------------------------------------
// compactGNF — montants compacts pour KPIs (rétrocompat)
// ---------------------------------------------------------------------------

/**
 * Formate un montant GNF en version courte pour les tableaux de bord.
 * Ex: compactGNF(1_500_000) → "1,5M GNF"
 */
export function compactGNF(amount: number): string {
  if (amount >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1).replace(".", ",");
    return val + "M\u00A0GNF";
  }
  if (amount >= 1_000) {
    const val = (amount / 1_000).toFixed(1).replace(".", ",");
    return val + "K\u00A0GNF";
  }
  return formatGNF(amount);
}

// ---------------------------------------------------------------------------
// getCurrencySymbol
// ---------------------------------------------------------------------------

export function getCurrencySymbol(currency: SupportedCurrency): string {
  const symbols: Record<SupportedCurrency, string> = {
    GNF: "GNF",
    XOF: "FCFA",
    USD: "$",
    EUR: "€",
  };
  return symbols[currency] ?? currency;
}
