"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";

export function AuditRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const scheduler = createRefreshScheduler(() => router.refresh(), {
      debounceMs: 400,
      minIntervalMs: 1200,
    });
    const channel = supa
      .channel("governance-audit")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "governance_audit_events" },
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
