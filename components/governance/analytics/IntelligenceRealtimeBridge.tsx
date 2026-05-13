"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";
import { ENTERPRISE_REALTIME_PAGE_REFRESH } from "@/lib/realtime/refresh-policy";
import { REALTIME_CHANNELS } from "@/lib/realtime/channels";

export function IntelligenceRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const scheduler = createRefreshScheduler(() => router.refresh(), {
      ...ENTERPRISE_REALTIME_PAGE_REFRESH,
    });

    const channel = supa
      .channel(REALTIME_CHANNELS.governance.intelligence)
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
