import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type ActionsGovernanceOverview = {
  pendingApprovals: number;
  unreadAlerts: number;
  highOrCriticalUnreadAlerts: number;
  auditEvents24h: number;
  activityLogs24h: number;
  infrastructureJobsPending: number;
  openObservabilityIncidents: number;
};

function countOrZero(n: number | null | undefined): number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Compteurs légers pour le hub Actions — requêtes head/count uniquement.
 */
export async function getActionsGovernanceOverview(): Promise<ActionsGovernanceOverview> {
  const supabase = getSupabaseServerClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    pendingApprovals,
    unreadAlerts,
    highCrit,
    audit24,
    logs24,
    jobsPending,
    incidents,
  ] = await Promise.all([
    supabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("governance_alerts").select("id", { count: "exact", head: true }).eq("status", "unread"),
    supabase
      .from("governance_alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread")
      .in("severity", ["high", "critical"]),
    supabase.from("governance_audit_events").select("id", { count: "exact", head: true }).gte("created_at", since24h),
    supabase.from("activity_logs").select("id", { count: "exact", head: true }).gte("created_at", since24h),
    supabase
      .from("erp_infrastructure_jobs")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing"]),
    supabase
      .from("erp_observability_incidents")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "investigating"]),
  ]);

  return {
    pendingApprovals: countOrZero(pendingApprovals.count),
    unreadAlerts: countOrZero(unreadAlerts.count),
    highOrCriticalUnreadAlerts: countOrZero(highCrit.count),
    auditEvents24h: countOrZero(audit24.count),
    activityLogs24h: countOrZero(logs24.count),
    infrastructureJobsPending: countOrZero(jobsPending.count),
    openObservabilityIncidents: countOrZero(incidents.count),
  };
}
