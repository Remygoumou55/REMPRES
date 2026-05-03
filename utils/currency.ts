import type { Currency } from "@/lib/currencyService";
import { formatMoney, type SupportedCurrency } from "@/lib/utils/formatCurrency";

/**
 * Affiche un montant déjà exprimé dans `currency` (pas de conversion).
 * Délègue à formatMoney — même rendu que PDF et lib/currencyService.formatAmount.
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return formatMoney(safeAmount, currency as SupportedCurrency, 1);
}
