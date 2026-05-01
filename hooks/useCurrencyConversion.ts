"use client";

import { useEffect, useMemo, useState } from "react";
import { convertCurrency } from "@/lib/services/currencyService";

type UseCurrencyConversionArgs = {
  amount: number;
  from: string;
  to: string;
  debounceMs?: number;
};

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

    const timer = window.setTimeout(async () => {
      setLoading(true);
      const result = await convertCurrency({ amount, from, to });
      if (mounted) {
        setConverted(result);
        setLoading(false);
        setUnavailable(result === null);
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

  const stableItems = useMemo(
    () => items.map((i) => ({ key: i.key, amount: i.amount })),
    [items],
  );

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
      setLoading(true);
      const pairs = await Promise.all(
        stableItems.map(async (item) => {
          let value: number | null;
          if (!Number.isFinite(item.amount)) {
            value = null;
          } else if (item.amount === 0) {
            value = 0;
          } else {
            value = await convertCurrency({ amount: item.amount, from, to });
          }
          return [item.key, value] as const;
        }),
      );
      if (mounted) {
        const map = Object.fromEntries(pairs);
        setConvertedByKey(map);
        setHasUnavailable(Object.values(map).some((v) => v === null));
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      mounted = false;
      window.clearTimeout(timer);
    };
  }, [debounceMs, from, stableItems, to]);

  return { convertedByKey, loading, hasUnavailable };
}
