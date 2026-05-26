export function computeMargin(
  priceGnf: number | null | undefined,
  costPriceGnf: number | null | undefined,
): number | null {
  if (!priceGnf || !costPriceGnf || priceGnf <= 0) return null;
  return Math.round(((priceGnf - costPriceGnf) / priceGnf) * 10000) / 100;
}

export type MarginLevel = "good" | "medium" | "low" | null;

export function getMarginLevel(m: number | null | undefined): MarginLevel {
  if (m == null) return null;
  if (m >= 30) return "good";
  if (m >= 10) return "medium";
  return "low";
}

export const MARGIN_COLORS = {
  good: "#27500A",
  medium: "#633806",
  low: "#791F1F",
} as const;

export const MARGIN_BG = {
  good: "#EAF3DE",
  medium: "#FAEEDA",
  low: "#FCEBEB",
} as const;

export function formatMargin(m: number | null | undefined): string {
  if (m == null) return "—";
  return `${m.toFixed(1)} %`;
}

export function formatGnf(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${new Intl.NumberFormat("fr-FR").format(n)} GNF`;
}
