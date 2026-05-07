"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";

export function ApprovalsRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const scheduler = createRefreshScheduler(() => router.refresh(), {
      debounceMs: 300,
      minIntervalMs: 1200,
    });
    const channel = supa
      .channel("governance-approvals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approval_requests" },
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
