"use client";

/**
 * CurrencyProvider
 *
 * Composant client invisible qui tourne en arrière-plan dès que l'app est montée.
 * Son rôle unique : maintenir les taux de change à jour dans le store Zustand.
 *
 * Stratégie :
 *  1. À chaque montage de session, on vérifie `lastUpdated` dans le store.
 *  2. Si jamais initialisé OU si le dernier rafraîchissement date de plus de
 *     REFRESH_INTERVAL_MS (1 heure), on appelle GET /api/currency/refresh.
 *  3. Le résultat est enregistré dans le store → tous les composants qui
 *     lisent `useCurrencyStore` voient les taux à jour sans reload.
 *  4. En cas d'erreur réseau, on garde les taux existants silencieusement.
 *
 * Ce composant ne rend rien (null) — il est purement fonctionnel.
 */

import { useEffect, useRef } from "react";
import { useCurrencyStore } from "@/stores/currencyStore";
import type { CurrencyRates } from "@/lib/currencyService";

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 heure

type RefreshResponse = {
  rates: CurrencyRates;
  updatedAt: string | null;
  fromCache: boolean;
  warning?: string;
};

export function CurrencyProvider() {
  const lastUpdated     = useCurrencyStore((s) => s.lastUpdated);
  const setRates        = useCurrencyStore((s) => s.setRates);
  const hasFetchedRef   = useRef(false);

  useEffect(() => {
    // Évite un double fetch en React Strict Mode (double mount en dev)
    if (hasFetchedRef.current) return;

    const shouldRefresh =
      !lastUpdated ||
      Date.now() - new Date(lastUpdated).getTime() > REFRESH_INTERVAL_MS;

    if (!shouldRefresh) {
      // Taux encore frais — rien à faire
      return;
    }

    hasFetchedRef.current = true;

    async function refresh() {
      try {
        const res = await fetch("/api/currency/refresh", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          // Pas de cache navigateur ici — on laisse le serveur décider
          cache: "no-store",
        });

        if (!res.ok) {
          // Utilisateur non connecté ou erreur serveur → on garde les taux existants
          return;
        }

        const data = (await res.json()) as RefreshResponse;

        if (data.rates && Object.keys(data.rates).length > 0) {
          const updatedAt = data.updatedAt ?? new Date().toISOString();
          setRates(data.rates, updatedAt);

          if (!data.fromCache) {
            console.info(
              "[CurrencyProvider] Taux mis à jour depuis l'API externe.",
              data.rates,
            );
          }
        }
      } catch {
        // Erreur réseau silencieuse — les taux existants (fallback) sont conservés
      }
    }

    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionnellement vide — on veut un seul appel par montage

  return null;
}
