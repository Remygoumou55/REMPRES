"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { createRefreshScheduler } from "@/lib/realtime/schedule-refresh";
import { ENTERPRISE_REALTIME_PAGE_REFRESH } from "@/lib/realtime/refresh-policy";
import { REALTIME_CHANNELS } from "@/lib/realtime/channels";

export function RecruitmentRealtimeBridge() {
  const router = useRouter();

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const scheduler = createRefreshScheduler(() => router.refresh(), {
      ...ENTERPRISE_REALTIME_PAGE_REFRESH,
    });

    const ch = REALTIME_CHANNELS.rh.recruitment;
    const channel = supa
      .channel(ch)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_recruitment_candidates" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_recruitment_interviews" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_recruitment_evaluations" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_recruitment_documents" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_recruitment_history" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "rh_recruitment_onboarding" }, scheduler.schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "approval_requests" }, scheduler.schedule)
      .subscribe();

    return () => {
      scheduler.cancel();
      void supa.removeChannel(channel);
    };
  }, [router]);

  return null;
}
