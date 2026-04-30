/**
 * lib/server/currencyService.ts
 *
 * Fonctions SERVEUR uniquement — nécessitent next/headers via supabaseServer.
 * Ne pas importer dans des Client Components.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { FALLBACK_RATES, type Currency, type CurrencyRates } from "@/lib/currencyService";

type RateRow = {
  base_currency?: string | null;
  quote_currency?: string | null;
  rate?: number | null;
  fetched_at?: string | null;
  currency_code?: string | null;
  rate_to_gnf?: number | null;
  updated_at?: string | null;
};

type ServiceResult<T> = { success: true; data: T } | { success: false; error: string };

const RATE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const rateCache = new Map<string, { value: number; expiresAt: number }>();

function norm(code: string): string {
  return String(code ?? "").trim().toUpperCase();
}

function cacheKey(from: string, to: string): string {
  return `${norm(from)}->${norm(to)}`;
}

function readCachedRate(from: string, to: string): number | null {
  const key = cacheKey(from, to);
  const item = rateCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    rateCache.delete(key);
    return null;
  }
  return item.value;
}

function writeCachedRate(from: string, to: string, value: number) {
  rateCache.set(cacheKey(from, to), {
    value,
    expiresAt: Date.now() + RATE_CACHE_TTL_MS,
  });
}

async function currencyExists(code: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await (supabase.from("currencies") as any)
      .select("code")
      .eq("code", norm(code))
      .maybeSingle();
    if (error) return true; // fail-open pour ne pas casser l'app si schéma partiel
    return !!data;
  } catch {
    return true;
  }
}

async function readRatePair(base: string, quote: string): Promise<number | null> {
  const supabase = getSupabaseServerClient();
  const b = norm(base);
  const q = norm(quote);

  // Schéma standard: base_currency + quote_currency + rate
  const { data: standardRows } = await (supabase.from("currency_rates") as any)
    .select("*")
    .eq("base_currency", b)
    .eq("quote_currency", q)
    .order("fetched_at", { ascending: false })
    .limit(1);

  const standardRate = (standardRows?.[0] as RateRow | undefined)?.rate;
  if (typeof standardRate === "number" && standardRate > 0) {
    return standardRate;
  }

  // Compat schéma alternatif: currency_code + rate_to_gnf
  if (b === "GNF") {
    const { data: modernRows } = await (supabase.from("currency_rates") as any)
      .select("*")
      .eq("currency_code", q)
      .limit(1);
    const rateToGnf = (modernRows?.[0] as RateRow | undefined)?.rate_to_gnf;
    if (typeof rateToGnf === "number" && rateToGnf > 0) return 1 / rateToGnf;
  }

  if (q === "GNF") {
    const { data: modernRows } = await (supabase.from("currency_rates") as any)
      .select("*")
      .eq("currency_code", b)
      .limit(1);
    const rateToGnf = (modernRows?.[0] as RateRow | undefined)?.rate_to_gnf;
    if (typeof rateToGnf === "number" && rateToGnf > 0) return rateToGnf;
  }

  return null;
}

// ---------------------------------------------------------------------------
// API métier centralisée (source de vérité backend)
// ---------------------------------------------------------------------------

export async function getRate(from: string, to: string): Promise<number> {
  const fromCode = norm(from);
  const toCode = norm(to);

  if (!fromCode || !toCode) {
    throw new Error("Code devise invalide.");
  }
  if (fromCode === toCode) return 1;

  const cached = readCachedRate(fromCode, toCode);
  if (cached !== null) return cached;

  // Validation (fail-soft si table currencies absente)
  const [fromExists, toExists] = await Promise.all([currencyExists(fromCode), currencyExists(toCode)]);
  if (!fromExists || !toExists) {
    throw new Error(`Devise inconnue (${fromCode} -> ${toCode}).`);
  }

  // Taux direct
  const direct = await readRatePair(fromCode, toCode);
  if (direct && direct > 0) {
    writeCachedRate(fromCode, toCode, direct);
    return direct;
  }

  // Taux inverse
  const inverse = await readRatePair(toCode, fromCode);
  if (inverse && inverse > 0) {
    const value = 1 / inverse;
    writeCachedRate(fromCode, toCode, value);
    return value;
  }

  // Conversion via base GNF
  const viaBaseA = await readRatePair(fromCode, "GNF");
  const viaBaseB = await readRatePair("GNF", toCode);
  if (viaBaseA && viaBaseB && viaBaseA > 0 && viaBaseB > 0) {
    const value = viaBaseA * viaBaseB;
    writeCachedRate(fromCode, toCode, value);
    return value;
  }

  throw new Error(`Taux introuvable (${fromCode} -> ${toCode}).`);
}

export async function convert(amount: number, from: string, to: string): Promise<number> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("amount doit être > 0.");
  }

  const rate = await getRate(from, to);
  return Math.round(amount * rate * 100) / 100;
}

export async function convertToBase(amount: number, from: string): Promise<number> {
  return convert(amount, from, "GNF");
}

// ---------------------------------------------------------------------------
// Compatibilité avec le reste de l'application
// ---------------------------------------------------------------------------

export async function getStoredRates(): Promise<CurrencyRates> {
  try {
    const targets: Currency[] = ["XOF", "USD", "EUR"];
    const rates: CurrencyRates = { GNF: 1 };
    for (const target of targets) {
      try {
        rates[target] = await getRate("GNF", target);
      } catch {
        rates[target] = FALLBACK_RATES[target] ?? 0;
      }
    }
    return rates;
  } catch (err) {
    console.error("[currencyService] Erreur dans getStoredRates :", err);
    return { ...FALLBACK_RATES };
  }
}

// ---------------------------------------------------------------------------
// 2. Mettre à jour les taux depuis l'API temps réel
// ---------------------------------------------------------------------------

type ExchangeRateApiResponse = {
  rates: Record<string, number>;
};

export async function fetchAndUpdateRates(): Promise<{
  success: boolean;
  rates?: CurrencyRates;
  error?: string;
}> {
  const TARGET_CURRENCIES: Currency[] = ["XOF", "USD", "EUR"];

  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/GNF", {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return { success: false, error: `API externe : HTTP ${response.status}` };
    }

    const json = (await response.json()) as ExchangeRateApiResponse;
    const apiRates = json.rates;
    const rates: CurrencyRates = { GNF: 1 };
    const upsertRowsStandard: {
      base_currency: string;
      quote_currency: string;
      rate: number;
      source: string;
      fetched_at: string;
      valid_from: string;
      created_at: string;
    }[] = [];
    const upsertRowsModern: { currency_code: string; rate_to_gnf: number; updated_at: string }[] = [];
    const now = new Date().toISOString();

    for (const cur of TARGET_CURRENCIES) {
      const rateFromGNF = apiRates[cur];
      if (typeof rateFromGNF !== "number" || rateFromGNF <= 0) continue;
      rates[cur] = rateFromGNF;
      upsertRowsStandard.push({
        base_currency: "GNF",
        quote_currency: cur,
        rate: rateFromGNF,
        source: "exchangerate-api",
        fetched_at: now,
        valid_from: now,
        created_at: now,
      });
      upsertRowsModern.push({ currency_code: cur, rate_to_gnf: 1 / rateFromGNF, updated_at: now });
    }

    const supabase = getSupabaseServerClient();
    const { error: standardUpsertError } = await (supabase.from("currency_rates") as any)
      .upsert(upsertRowsStandard, { onConflict: "base_currency,quote_currency" });

    // Compatibilité ancienne structure
    if (standardUpsertError) {
      const { error: modernUpsertError } = await supabase
      .from("currency_rates")
      .upsert(upsertRowsModern, { onConflict: "currency_code" });
      if (modernUpsertError) {
        return { success: false, error: modernUpsertError.message };
      }
    }

    // Invalidation simple du cache local
    for (const cur of TARGET_CURRENCIES) {
      rateCache.delete(cacheKey("GNF", cur));
      rateCache.delete(cacheKey(cur, "GNF"));
    }

    return { success: true, rates };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
