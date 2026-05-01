import type { SupabaseClient } from "@supabase/supabase-js";
import { logError, logWarn } from "@/lib/logger";

type ConvertCurrencyArgs = {
  amount: number;
  from: string;
  to: string;
};

export type ConvertCurrencyRpcOptions = {
  /** Préfixe des logs (ex. distinction client / serveur). */
  logPrefix?: string;
};

const CACHE_TTL_MS = 30 * 1000;
const conversionCache = new Map<string, { value: number; expiresAt: number }>();
const inFlight = new Map<string, Promise<number | null>>();

function norm(code: string): string {
  return String(code ?? "").trim().toUpperCase();
}

function keyOf({ amount, from, to }: ConvertCurrencyArgs): string {
  return `${amount}:${norm(from)}:${norm(to)}`;
}

function readCache(key: string): number | null {
  const hit = conversionCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    conversionCache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key: string, value: number) {
  conversionCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Conversion métier via RPC Supabase — point unique pour l’appel réseau `convert_currency`.
 * Accepte tout client Supabase (navigateur ou serveur).
 */
export async function convertCurrencyRpc(
  supabase: SupabaseClient,
  { amount, from, to }: ConvertCurrencyArgs,
  options?: ConvertCurrencyRpcOptions,
): Promise<number | null> {
  const logPrefix = options?.logPrefix ?? "Currency conversion failed";

  const fromCode = norm(from);
  const toCode = norm(to);
  const safeAmount = Number(amount);

  if (!Number.isFinite(safeAmount)) return null;
  if (safeAmount === 0) return 0;
  if (!fromCode || !toCode) return null;
  if (fromCode === toCode) return Math.round(safeAmount * 100) / 100;

  const cacheKey = keyOf({ amount: safeAmount, from: fromCode, to: toCode });
  const cached = readCache(cacheKey);
  if (cached !== null) return cached;

  const ongoing = inFlight.get(cacheKey);
  if (ongoing) return ongoing;

  const run = (async () => {
    try {
      const { data, error } = await supabase.rpc("convert_currency", {
        amount: safeAmount,
        from_currency: fromCode,
        to_currency: toCode,
      });

      if (error) {
        logError("currency", logPrefix, {
          amount: safeAmount,
          from: fromCode,
          to: toCode,
          error,
        });
        return null;
      }

      const safeValue = typeof data === "number" && Number.isFinite(data) ? data : null;
      if (safeValue === null) {
        logWarn("currency", "RPC returned non numeric value", {
          amount: safeAmount,
          from: fromCode,
          to: toCode,
        });
        return null;
      }
      writeCache(cacheKey, safeValue);
      return safeValue;
    } catch (err) {
      logError("currency", logPrefix, {
        amount: safeAmount,
        from: fromCode,
        to: toCode,
        error: err,
      });
      return null;
    } finally {
      inFlight.delete(cacheKey);
    }
  })();

  inFlight.set(cacheKey, run);
  return run;
}
