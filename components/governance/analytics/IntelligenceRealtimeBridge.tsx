"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function IntelligenceRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => router.refresh(), 500);
    };

    const channel = supa
      .channel("governance-intelligence")
      .on("postgres_changes", { event: "*", schema: "public", table: "governance_alerts" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "approval_requests" }, scheduleRefresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "governance_audit_events" }, scheduleRefresh)
      .subscribe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      void supa.removeChannel(channel);
    };
  }, [router]);

  return null;
}
