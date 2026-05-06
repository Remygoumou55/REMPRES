"use client";

import { useEffect, useMemo, useState } from "react";
import { convertCurrency } from "@/lib/services/currencyService";

type UseCurrencyConversionArgs = {
  amount: number;
  from: string;
  to: string;
  debounceMs?: number;
};

const conversionCache = new Map<string, { value: number | null; ts: number }>();
const MAX_CACHE_ENTRIES = 2000;
const CACHE_STORAGE_KEY = "rempres.currency.conversion.cache.v2";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure — aligné sur le rafraîchissement des taux
let cacheHydrated = false;
let persistTimer: number | null = null;

function makeConversionCacheKey(from: string, to: string, amount: number) {
  return `${from}->${to}:${amount}`;
}

function getCachedConversion(from: string, to: string, amount: number) {
  hydrateCacheFromStorage();
  const entry = conversionCache.get(makeConversionCacheKey(from, to, amount));
  if (!entry) return undefined;
  // Invalider si le cache est trop vieux
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    conversionCache.delete(makeConversionCacheKey(from, to, amount));
    return undefined;
  }
  return entry.value;
}

function hydrateCacheFromStorage() {
  if (cacheHydrated || typeof window === "undefined") return;
  cacheHydrated = true;
  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Array<[string, { value: number | null; ts: number }]>;
    if (!Array.isArray(parsed)) return;
    const now = Date.now();
    for (const pair of parsed.slice(-MAX_CACHE_ENTRIES)) {
      if (!Array.isArray(pair) || pair.length !== 2) continue;
      const [key, entry] = pair;
      if (typeof key !== "string" || !entry || typeof entry !== "object") continue;
      if (entry.value !== null && !Number.isFinite(entry.value)) continue;
      // Ignorer les entrées expirées au chargement
      if (typeof entry.ts === "number" && now - entry.ts > CACHE_TTL_MS) continue;
      conversionCache.set(key, { value: entry.value, ts: entry.ts ?? now });
    }
  } catch {
    // Ignore corrupted cache payloads silently.
  }
}

function persistCacheToStorageSoon() {
  if (typeof window === "undefined") return;
  if (persistTimer !== null) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    persistTimer = null;
    try {
      const payload = JSON.stringify(Array.from(conversionCache.entries()).slice(-MAX_CACHE_ENTRIES));
      window.localStorage.setItem(CACHE_STORAGE_KEY, payload);
    } catch {
      // Ignore storage quota or serialization failures.
    }
  }, 120);
}

function setCachedConversion(from: string, to: string, amount: number, value: number | null) {
  hydrateCacheFromStorage();
  if (conversionCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = conversionCache.keys().next().value;
    if (oldest) conversionCache.delete(oldest);
  }
  conversionCache.set(makeConversionCacheKey(from, to, amount), { value, ts: Date.now() });
  persistCacheToStorageSoon();
}

function shallowEqualRecord(
  a: Record<string, number | null>,
  b: Record<string, number | null>,
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function useCurrencyConversion({
  amount,
  from,
  to,
  debounceMs = 180,
}: UseCurrencyConversionArgs) {
  const [converted, setConverted] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!Number.isFinite(amount)) {
      setConverted(null);
      setLoading(false);
      setUnavailable(false);
      return () => {
        mounted = false;
      };
    }
    if (amount === 0) {
      setConverted(0);
      setLoading(false);
      setUnavailable(false);
      return () => {
        mounted = false;
      };
    }
    const cached = getCachedConversion(from, to, amount);
    if (cached !== undefined) {
      setConverted((prev) => (prev === cached ? prev : cached));
      setUnavailable(cached === null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await convertCurrency({ amount, from, to });
        if (!mounted) return;
        setCachedConversion(from, to, amount, result);
        setConverted((prev) => (prev === result ? prev : result));
        setUnavailable(result === null);
      } catch {
        if (mounted) {
          setCachedConversion(from, to, amount, null);
          setConverted((prev) => (prev === null ? prev : null));
          setUnavailable(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }, debounceMs);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [amount, debounceMs, from, to]);

  return { converted, loading, unavailable };
}

type BatchItem = {
  key: string;
  amount: number;
};

export function useCurrencyBatchConversion(
  items: BatchItem[],
  from: string,
  to: string,
  debounceMs = 180,
) {
  const [convertedByKey, setConvertedByKey] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [hasUnavailable, setHasUnavailable] = useState(false);

  const itemsSignature = useMemo(
    () => items.map((i) => `${i.key}:${i.amount}`).join("|"),
    [items],
  );
  const stableItems = useMemo(() => items, [itemsSignature]);

  useEffect(() => {
    let mounted = true;
    if (stableItems.length === 0) {
      setConvertedByKey({});
      setLoading(false);
      setHasUnavailable(false);
      return () => {
        mounted = false;
      };
    }

    const timer = window.setTimeout(async () => {
      const initialMap: Record<string, number | null> = {};
      const toConvert: BatchItem[] = [];
      for (const item of stableItems) {
        if (!Number.isFinite(item.amount)) {
          initialMap[item.key] = null;
          continue;
        }
        if (item.amount === 0) {
          initialMap[item.key] = 0;
          continue;
        }
        const cached = getCachedConversion(from, to, item.amount);
        if (cached !== undefined) {
          initialMap[item.key] = cached;
        } else {
          toConvert.push(item);
        }
      }

      if (toConvert.length === 0) {
        if (mounted) {
          setConvertedByKey((prev) => (shallowEqualRecord(prev, initialMap) ? prev : initialMap));
          setHasUnavailable(Object.values(initialMap).some((v) => v === null));
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const pairs = await Promise.all(
          toConvert.map(async (item) => {
            let value: number | null;
            try {
              value = await convertCurrency({ amount: item.amount, from, to });
            } catch {
              value = null;
            }
            setCachedConversion(from, to, item.amount, value);
            return [item.key, value] as const;
          }),
        );
        if (mounted) {
          const map = { ...initialMap, ...Object.fromEntries(pairs) };
          setConvertedByKey((prev) => (shallowEqualRecord(prev, map) ? prev : map));
          setHasUnavailable(Object.values(map).some((v) => v === null));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }, debounceMs);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [debounceMs, from, stableItems, to]);

  return { convertedByKey, loading, hasUnavailable };
}
