/**
 * lib/server/currencyService.ts
 *
 * Fonctions SERVEUR uniquement — nécessitent next/headers via supabaseServer.
 * Ne pas importer dans des Client Components.
 */

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { FALLBACK_RATES, type Currency, type CurrencyRates } from "@/lib/currencyService";

// ---------------------------------------------------------------------------
// 1. Charger les taux depuis Supabase
// ---------------------------------------------------------------------------

export async function getStoredRates(): Promise<CurrencyRates> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("currency_rates")
      .select("currency_code, rate_to_gnf");

    if (error || !data || data.length === 0) {
      console.warn("[currencyService] Impossible de lire currency_rates :", error?.message);
      return { ...FALLBACK_RATES };
    }

    const rates: CurrencyRates = { GNF: 1 };
    for (const row of data as { currency_code: string; rate_to_gnf: number }[]) {
      if (row.currency_code !== "GNF") {
        rates[row.currency_code] = row.rate_to_gnf > 0 ? 1 / row.rate_to_gnf : 0;
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
    const upsertRows: { currency_code: string; rate_to_gnf: number; updated_at: string }[] = [];
    const now = new Date().toISOString();

    for (const cur of TARGET_CURRENCIES) {
      const rateFromGNF = apiRates[cur];
      if (typeof rateFromGNF !== "number" || rateFromGNF <= 0) continue;
      rates[cur] = rateFromGNF;
      upsertRows.push({ currency_code: cur, rate_to_gnf: rateFromGNF > 0 ? 1 / rateFromGNF : 0, updated_at: now });
    }

    const supabase = getSupabaseServerClient();
    const { error: upsertError } = await supabase
      .from("currency_rates")
      .upsert(upsertRows, { onConflict: "currency_code" });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    return { success: true, rates };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
