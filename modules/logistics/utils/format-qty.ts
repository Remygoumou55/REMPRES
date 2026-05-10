export function formatQty(value: number, locale = "fr-FR"): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}
