import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type SettingsGovernanceOverview = {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  inactiveUsers: number;
  securityEvents24h: number;
  unreadAlerts: number;
};

export const getSettingsGovernanceOverview = cache(async (): Promise<SettingsGovernanceOverview> => {
  const supabase = getSupabaseServerClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, activeRes, inactiveRes, logsRes, alertsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("is_active", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("is_active", false),
    supabase.from("activity_logs").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("governance_alerts").select("id", { count: "exact", head: true }).eq("status", "unread"),
  ]);

  const total = totalRes.count ?? 0;
  const active = activeRes.count ?? 0;
  const inactive = inactiveRes.count ?? 0;

  return {
    totalUsers: total,
    activeUsers: active,
    pendingUsers: Math.max(0, total - active - inactive),
    inactiveUsers: inactive,
    securityEvents24h: logsRes.count ?? 0,
    unreadAlerts: alertsRes.count ?? 0,
  };
});
