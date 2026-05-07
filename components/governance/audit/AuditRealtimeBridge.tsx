"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function AuditRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const channel = supa
      .channel("governance-audit")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "governance_audit_events" },
        () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => router.refresh(), 400);
        },
      )
      .subscribe();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      void supa.removeChannel(channel);
    };
  }, [router]);

  return null;
}
