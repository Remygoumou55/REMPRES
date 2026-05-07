"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function ApprovalsRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const channel = supa
      .channel("governance-approvals")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "approval_requests" },
        () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => router.refresh(), 300);
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
