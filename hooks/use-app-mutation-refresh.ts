"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  invalidateAppQueries,
  type AppSyncOptions,
} from "@/lib/realtime/invalidate-app-queries";

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
 * Politique unique après mutation : synchroniser données client + Server Components.
 *
 * - **`refreshAfterMutation`** — invalide React Query (KPIs, dashboards) puis `router.refresh()`.
 * - **`pushThenRefresh`** — navigation vers une nouvelle URL (ex. flash message).
 */
export function useAppMutationRefresh() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const refreshAfterMutation = useCallback(
    (options?: AppSyncOptions) => {
      void invalidateAppQueries(queryClient, options);
      router.refresh();
    },
    [queryClient, router],
  );

  const pushThenRefresh = useCallback(
    (href: string, options?: AppSyncOptions) => {
      void invalidateAppQueries(queryClient, options);
      if (isCurrentLocation(href)) {
        router.refresh();
        return;
      }
      router.push(href);
    },
    [queryClient, router],
  );

  return useMemo(
    () => ({
      refreshAfterMutation,
      pushThenRefresh,
    }),
    [pushThenRefresh, refreshAfterMutation],
  );
}
