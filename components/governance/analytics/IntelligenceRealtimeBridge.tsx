"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";

export function IntelligenceRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const scheduler = createRefreshScheduler(() => router.refresh(), {
      debounceMs: 500,
      minIntervalMs: 1500,
    });

    const channel = supa
      .channel("governance-intelligence")
      .on("postgres_changes", { event: "*", schema: "public", table: "governance_alerts" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "approval_requests" }, scheduler.schedule)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "governance_audit_events" }, scheduler.schedule)
      .subscribe();

    return () => {
      scheduler.cancel();
      void supa.removeChannel(channel);
    };
  }, [router]);

  return null;
}
