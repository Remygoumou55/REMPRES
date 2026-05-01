/**
 * GET /api/currency/refresh
 *
 * Retourne les taux de change à jour depuis la base Supabase.
 * Si les taux sont obsolètes (> STALE_THRESHOLD_MS), l'endpoint appelle
 * l'API externe ExchangeRate-API pour les rafraîchir avant de répondre.
 *
 * Sécurité : session Supabase obligatoire (authentifié uniquement).
 * Cache navigateur : Cache-Control max-age=3600 → le navigateur ne rappelle pas
 * dans la même heure, mais le CurrencyProvider le fait au pire une fois par session.
 *
 * Réponse JSON :
 * {
 *   rates:       { GNF: 1, XOF: 0.046, USD: 0.000116, EUR: 0.000107 },
 *   updatedAt:   "2026-04-29T18:00:00.000Z",
 *   fromCache:   true | false   (indique si on a fait un appel externe)
 * }
 */

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  fetchAndUpdateRates,
  getStoredRates,
} from "@/lib/server/currencyService";
import { FALLBACK_RATES } from "@/lib/currencyService";
import { logError, logWarn } from "@/lib/logger";

// Durée (ms) au-delà de laquelle les taux sont considérés obsolètes
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 heure

export async function GET() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    // ── Lire le dernier updated_at en base ────────────────────────────────
    const { data: latestRow } = await supabase
      .from("currency_rates")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastUpdated = latestRow?.updated_at
      ? new Date(latestRow.updated_at)
      : null;

    const isStale =
      !lastUpdated ||
      Date.now() - lastUpdated.getTime() > STALE_THRESHOLD_MS;

    let rates = await getStoredRates();
    let updatedAt = lastUpdated?.toISOString() ?? null;
    let fromCache = !isStale;

    // ── Si obsolète → appel externe et mise à jour DB ─────────────────────
    if (isStale) {
      const result = await fetchAndUpdateRates();

      if (result.success && result.rates) {
        rates = result.rates;
        updatedAt = new Date().toISOString();
        fromCache = false;
      } else {
        // L'appel externe a échoué → on renvoie les taux en base (ou fallback)
        logWarn("currency", "external refresh failed", {
          userId: auth.user.id,
          error: result.error,
        });
        if (Object.keys(rates).length <= 1) {
          rates = { ...FALLBACK_RATES };
        }
      }
    }

    return NextResponse.json(
      { rates, updatedAt, fromCache },
      {
        status: 200,
        headers: {
          // Cache navigateur : 1 heure
          "Cache-Control": "private, max-age=3600",
        },
      },
    );
  } catch (err) {
    logError("currency", "refresh route unexpected error", {
      userId: auth.user.id,
      error: err,
    });
    return NextResponse.json(
      {
        rates: { ...FALLBACK_RATES },
        updatedAt: null,
        fromCache: false,
        warning: "Taux de secours utilisés.",
      },
      { status: 200 },
    );
  }
}
