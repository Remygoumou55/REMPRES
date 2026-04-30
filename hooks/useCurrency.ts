"use client";

import { useCurrencyContext } from "@/context/CurrencyContext";

export function useCurrency() {
  return useCurrencyContext();
}
