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
import {
  actionTypeFromApprovalRow,
  modulesForApprovalAction,
} from "@/lib/realtime/approval-sync";
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

    const scheduler = createRefreshScheduler(() => router.refresh(), {
      ...ENTERPRISE_REALTIME_PAGE_REFRESH,
    });

    const syncTables = (tables: string[]) => {
      void invalidateAppQueries(queryClient, { tables });
      scheduler.schedule();
    };

    const syncApprovalRequest = (row: Record<string, unknown> | undefined) => {
      const actionType = actionTypeFromApprovalRow(row);
      void invalidateAppQueries(queryClient, {
        modules: modulesForApprovalAction(actionType),
        tables: ["approval_requests"],
      });
      scheduler.schedule();
    };

    let channel: RealtimeChannel = supa.channel(REALTIME_CHANNELS.app.global);

    for (const table of APP_REALTIME_WATCHED_TABLES) {
      if (table === "approval_requests") {
        channel = channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table: "approval_requests" },
          (payload) => {
            const row = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
            syncApprovalRequest(row);
          },
        );
        continue;
      }
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => syncTables([table]),
      );
    }

    channel.subscribe();

    return () => {
      scheduler.cancel();
      void supa.removeChannel(channel);
    };
  }, [queryClient, router]);
}
