import type { Currency } from "@/lib/currencyService";

const FORMAT_LOCALE: Record<Currency, string> = {
  GNF: "fr-GN",
  USD: "en-US",
  EUR: "fr-FR",
  XOF: "fr-FR",
};

const CURRENCY_CONFIG: Record<Currency, { style: "currency" | "decimal"; currency?: string; suffix?: string }> = {
  GNF: { style: "decimal", suffix: "GNF" },
  USD: { style: "currency", currency: "USD" },
  EUR: { style: "currency", currency: "EUR" },
  XOF: { style: "currency", currency: "XOF" },
};

export function formatCurrency(amount: number, currency: Currency): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const cfg = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG.GNF;
  const locale = FORMAT_LOCALE[currency] ?? "fr-FR";

  if (cfg.style === "currency" && cfg.currency) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: cfg.currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(safeAmount);
  }

  const numberPart = new Intl.NumberFormat(locale, {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(safeAmount);
  return `${numberPart} ${cfg.suffix ?? currency}`;
}
