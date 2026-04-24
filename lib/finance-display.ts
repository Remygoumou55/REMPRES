/**
 * Affichage des montants (GNF → devise) — ne modifie pas les données source.
 */
import { convertAmount, formatAmount, type Currency, type CurrencyRates } from "@/lib/currencyService";

export function displayGnf(
  amountGnf: number,
  currency: Currency,
  rates: CurrencyRates,
): string {
  return formatAmount(convertAmount(amountGnf, currency, rates), currency);
}
