"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useRef } from "react";
import { useCurrencyStore } from "@/stores/currencyStore";
import { FALLBACK_RATES, formatAmount, type Currency, type CurrencyRates } from "@/lib/currencyService";
import { logInfo } from "@/lib/logger";

const USER_CURRENCY_KEY = "user_currency";
/** Aligné sur STALE_THRESHOLD_MS côté `/api/currency/refresh` — une seule logique de fraîcheur. */
const REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const REFRESH_TIMEOUT_MS = 2500;
const RETRY_COOLDOWN_MS = 60 * 1000;

type CurrencyContextValue = {
  currency: Currency;
  rates: CurrencyRates;
  getUserCurrency: () => Currency;
  setUserCurrency: (currency: Currency) => void;
  format: (amount: number, currency: Currency) => string;
  loading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const CURRENCIES: Currency[] = ["GNF", "USD", "EUR", "XOF"];

function safeCurrency(value: string | null | undefined): Currency {
  const normalized = String(value ?? "GNF").toUpperCase() as Currency;
  return CURRENCIES.includes(normalized) ? normalized : "GNF";
}

export function CurrencyContextProvider({ children }: { children: React.ReactNode }) {
  const selectedCurrency = useCurrencyStore((s) => s.selectedCurrency);
  const rates = useCurrencyStore((s) => s.rates);
  const lastUpdated = useCurrencyStore((s) => s.lastUpdated);
  const setSelectedCurrency = useCurrencyStore((s) => s.setSelectedCurrency);
  const setRates = useCurrencyStore((s) => s.setRates);
  const inFlightRef = useRef(false);
  const lastAttemptRef = useRef<number>(0);
  const lastFailureRef = useRef<number>(0);
  const mountedRef = useRef(true);

  const loading = !lastUpdated;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_CURRENCY_KEY);
      if (stored) {
        const safe = safeCurrency(stored);
        if (safe !== selectedCurrency) {
          setSelectedCurrency(safe);
        }
      } else {
        localStorage.setItem(USER_CURRENCY_KEY, selectedCurrency);
      }
    } catch {
      // no-op
    }
  }, [selectedCurrency, setSelectedCurrency]);

  /** Rafraîchissement des taux : store jamais initialisé ou plus vieux que REFRESH_INTERVAL_MS. */
  useEffect(() => {
    if (inFlightRef.current) return;
    const now = Date.now();
    if (now - lastAttemptRef.current < 10_000) return;
    if (lastFailureRef.current > 0 && now - lastFailureRef.current < RETRY_COOLDOWN_MS) return;

    const needsFetch =
      !lastUpdated ||
      now - new Date(lastUpdated as string).getTime() > REFRESH_INTERVAL_MS;

    if (!needsFetch) return;

    let cancelled = false;
    inFlightRef.current = true;
    lastAttemptRef.current = now;

    async function refreshRates() {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
      try {
        const res = await fetch("/api/currency/refresh", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) {
          lastFailureRef.current = Date.now();
          return;
        }
        const data = (await res.json()) as {
          rates?: CurrencyRates;
          updatedAt?: string | null;
          fromCache?: boolean;
        };

        if (!cancelled && mountedRef.current && data.rates && Object.keys(data.rates).length > 0) {
          setRates(data.rates, data.updatedAt ?? new Date().toISOString());
          lastFailureRef.current = 0;
          if (!data.fromCache) {
            logInfo("currency", "rates refreshed from external API", { rates: data.rates });
          }
        } else {
          lastFailureRef.current = Date.now();
        }
      } catch {
        lastFailureRef.current = Date.now();
      } finally {
        window.clearTimeout(timeoutId);
        inFlightRef.current = false;
      }
    }

    refreshRates();
    return () => {
      cancelled = true;
    };
  }, [lastUpdated, setRates]);

  const value = useMemo<CurrencyContextValue>(() => {
    const safeRates = Object.keys(rates).length > 0 ? rates : FALLBACK_RATES;

    return {
      currency: selectedCurrency,
      rates: safeRates,
      getUserCurrency: () => selectedCurrency,
      setUserCurrency: (currency) => {
        const safe = safeCurrency(currency);
        setSelectedCurrency(safe);
        try {
          localStorage.setItem(USER_CURRENCY_KEY, safe);
        } catch {
          // no-op
        }
      },
      format: (amount, currency) => formatAmount(Number.isFinite(amount) ? amount : 0, currency),
      loading,
    };
  }, [loading, rates, selectedCurrency, setSelectedCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrencyContext() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrencyContext must be used inside CurrencyContextProvider.");
  }
  return ctx;
}
