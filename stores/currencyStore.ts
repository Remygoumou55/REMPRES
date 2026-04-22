"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Currency, CurrencyRates } from "@/lib/currencyService";
import { FALLBACK_RATES } from "@/lib/currencyService";

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

type CurrencyState = {
  /** Devise actuellement sélectionnée par l'utilisateur. */
  selectedCurrency: Currency;
  /** Taux de conversion depuis GNF (ex : { GNF: 1, USD: 0.000116 }). */
  rates: CurrencyRates;
  /** ISO 8601 du dernier chargement des taux, ou null si jamais chargé. */
  lastUpdated: string | null;
};

type CurrencyActions = {
  /** Changer la devise d'affichage active. */
  setSelectedCurrency: (currency: Currency) => void;
  /** Enregistrer de nouveaux taux (appelé après fetchAndUpdateRates / getStoredRates). */
  setRates: (rates: CurrencyRates, updatedAt: string) => void;
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCurrencyStore = create<CurrencyState & CurrencyActions>()(
  persist(
    (set) => ({
      // --- état initial ---
      selectedCurrency: "GNF",
      rates: { ...FALLBACK_RATES },
      lastUpdated: null,

      // --- actions ---
      setSelectedCurrency: (currency) => set({ selectedCurrency: currency }),

      setRates: (rates, updatedAt) =>
        set({ rates: { GNF: 1, ...rates }, lastUpdated: updatedAt }),
    }),
    {
      name: "rempres-currency",
      storage: createJSONStorage(() => localStorage),
      // Seuls ces champs sont persistés ; les actions ne le sont jamais.
      partialize: (state) => ({
        selectedCurrency: state.selectedCurrency,
        rates: state.rates,
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
);
