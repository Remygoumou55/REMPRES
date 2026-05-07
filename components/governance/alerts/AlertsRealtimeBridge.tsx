"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";

export function AlertsRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const scheduler = createRefreshScheduler(() => router.refresh(), {
      debounceMs: 300,
      minIntervalMs: 1200,
    });
    const channel = supa
      .channel("governance-alerts")
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
