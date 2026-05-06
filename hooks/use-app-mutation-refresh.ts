"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

/** Même pathname + search que `href` (évite un `push` inutile si seul le flash change déjà l’URL). */
function isCurrentLocation(href: string): boolean {
  if (typeof window === "undefined") return false;
  const resolved = new URL(href, window.location.origin);
  return (
    resolved.pathname + resolved.search ===
    window.location.pathname + window.location.search
  );
}

/**
 * Politique unique après mutation : synchroniser via navigation Next.js uniquement.
 *
 * - **`refreshAfterMutation`** — même page : `router.refresh()` uniquement.
 * - **`pushThenRefresh`** — nouvelle URL (ex. query flash) : `router.push(href)` uniquement
 *   (pas de double refresh ; la navigation déclenche le rendu de la nouvelle route).
 */
export function useAppMutationRefresh() {
  const router = useRouter();

  const refreshAfterMutation = useCallback(() => {
    router.refresh();
  }, [router]);

  const pushThenRefresh = useCallback(
    (href: string) => {
      if (isCurrentLocation(href)) {
        router.refresh();
        return;
      }
      router.push(href);
    },
    [router],
  );

  return useMemo(
    () => ({
      refreshAfterMutation,
      pushThenRefresh,
    }),
    [pushThenRefresh, refreshAfterMutation],
  );
}
