"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";
import { REALTIME_CHANNELS } from "@/lib/realtime/channels";

/** Rafraîchit la page contrats sur changements métier (sans toucher au socle realtime global). */
export function ContractRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const scheduler = createRefreshScheduler(() => router.refresh(), {
      debounceMs: 300,
      minIntervalMs: 1200,
    });

    const channel = supa
      .channel(REALTIME_CHANNELS.rh.contracts)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_employee_contracts" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_contract_documents" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_contract_history" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "approval_requests" }, scheduler.schedule)
      .subscribe();

    return () => {
      scheduler.cancel();
      void supa.removeChannel(channel);
    };
  }, [router]);

  return null;
}
