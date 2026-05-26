"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { REALTIME_CHANNELS } from "@/lib/realtime/channels";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";
import { ENTERPRISE_REALTIME_PAGE_REFRESH } from "@/lib/realtime/refresh-policy";
import { APP_REALTIME_WATCHED_TABLES } from "@/lib/realtime/app-tables";
import { invalidateAppQueries } from "@/lib/realtime/invalidate-app-queries";

/**
 * Pont realtime global : écoute les tables métier et synchronise
 * React Query + Server Components (`router.refresh`) sans action manuelle.
 */
export function useAppRealtimeSync(): void {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();

    const sync = (tables: string[]) => {
      void invalidateAppQueries(queryClient, { tables });
      scheduler.schedule();
    };

    const scheduler = createRefreshScheduler(() => router.refresh(), {
      ...ENTERPRISE_REALTIME_PAGE_REFRESH,
    });

    let channel: RealtimeChannel = supa.channel(REALTIME_CHANNELS.app.global);

    for (const table of APP_REALTIME_WATCHED_TABLES) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => sync([table]),
      );
    }

    channel.subscribe();

    return () => {
      scheduler.cancel();
      void supa.removeChannel(channel);
    };
  }, [queryClient, router]);
}
