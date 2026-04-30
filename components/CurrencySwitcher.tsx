"use client";

import { Globe } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import type { Currency } from "@/lib/currencyService";

const CURRENCY_OPTIONS: Array<{ code: Currency; label: string; symbol: string }> = [
  { code: "GNF", label: "Franc guinéen", symbol: "GNF" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "EUR" },
  { code: "XOF", label: "Franc CFA", symbol: "FCFA" },
];

export function CurrencySwitcher() {
  const { currency, setUserCurrency } = useCurrency();

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700">
      <Globe size={13} className="text-gray-400" />
      <select
        aria-label="Changer la devise"
        className="bg-transparent font-medium outline-none"
        value={currency}
        onChange={(e) => setUserCurrency(e.target.value as Currency)}
      >
        {CURRENCY_OPTIONS.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.code} ({opt.symbol})
          </option>
        ))}
      </select>
    </label>
  );
}
