"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";
import { ENTERPRISE_REALTIME_PAGE_REFRESH } from "@/lib/realtime/refresh-policy";
import { REALTIME_CHANNELS } from "@/lib/realtime/channels";

export function AlertsRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const scheduler = createRefreshScheduler(() => router.refresh(), {
      ...ENTERPRISE_REALTIME_PAGE_REFRESH,
    });
    const channel = supa
      .channel(REALTIME_CHANNELS.governance.alerts)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "governance_alerts" },
        scheduler.schedule,
      )
      .subscribe();

    return () => {
      scheduler.cancel();
      void supa.removeChannel(channel);
    };
  }, [router]);

  return null;
}
