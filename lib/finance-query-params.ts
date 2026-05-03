/**
 * Paramètres URL partagés — page /finance et export /api/finance/export.
 */
import { isValid, parseISO } from "date-fns";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** yyyy-MM-dd dans l’URL : rejette les dates calendairement invalides (ex. 2024-02-30). */
export function parseFinanceIsoDate(s: string | undefined | null, fallback: string): string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return fallback;
  return isValid(parseISO(s)) ? s : fallback;
}

export function parseCategoryIds(
  v: string | string[] | undefined,
): string[] {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter((s) => UUID.test(s));
}

export function parseCreatedBy(
  v: string | undefined,
  allow: boolean,
): string | null {
  if (!allow || !v || !UUID.test(v)) return null;
  return v;
}
