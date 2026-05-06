"use client";

import { useMemo } from "react";
import { useCurrencyStore } from "@/stores/currencyStore";
import { convertGnfWithRates, type Currency } from "@/lib/currencyService";
import { formatCurrency } from "@/utils/currency";

export function PriceText({ amount, currency }: { amount: number; currency: Currency }) {
  const rates = useCurrencyStore((s) => s.rates);
  const converted = useMemo(
    () => convertGnfWithRates(amount, currency, rates),
    [amount, currency, rates],
  );
  if (!Number.isFinite(converted)) return <>—</>;
  return <>{formatCurrency(converted, currency)}</>;
}
