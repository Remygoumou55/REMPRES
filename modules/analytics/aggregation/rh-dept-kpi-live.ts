import type { SupabaseClient } from "@supabase/supabase-js";
import type { DeptKpiPayload } from "@/lib/dept/kpi-contract";
import type { Database } from "@/types/database.types";
import { safeCount, safeData } from "@/modules/analytics/utils/supabase-safe";

/**
 * Agrégation live KPI dept RH (contrat dashboard inchangé).
 * Respecte la RLS du client Supabase courant (vue utilisateur).
 */
export async function computeRhDeptKpisLive(supabase: SupabaseClient<Database>): Promise<DeptKpiPayload> {
  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [activeEmployees, pendingLeaves, unreadAlerts, attendanceToday, recentHires] = await Promise.all([
    safeCount(
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .neq("role_key", "super_admin")
        .neq("role_key", "directeur_general"),
    ),
    safeCount(
      supabase.from("rh_leave_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ),
    safeCount(
      supabase
        .from("governance_alerts")
        .select("id", { count: "exact", head: true })
        .eq("department_key", "rh")
        .eq("status", "unread"),
    ),
    safeCount(
      supabase
        .from("rh_attendance_events")
        .select("id", { count: "exact", head: true })
        .gte("event_at", startOfDay.toISOString()),
    ),
    safeData(
      supabase
        .from("profiles")
        .select("id,first_name,last_name,created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(3),
      [] as { id: string; first_name: string | null; last_name: string | null; created_at: string | null }[],
    ),
  ]);

  return {
    stats: [
      { id: "activeEmployees", label: "dashboard.dept.kpi.activeEmployees", value: activeEmployees, unit: "count" },
      { id: "presentToday", label: "dashboard.dept.kpi.presentToday", value: attendanceToday, unit: "count" },
      { id: "pendingLeaves", label: "dashboard.dept.kpi.pendingLeaves", value: pendingLeaves, unit: "count" },
      { id: "rhUnreadAlerts", label: "dashboard.rh.kpi.unreadAlerts", value: unreadAlerts, unit: "count" },
    ],
    charts: [],
    alerts: [],
    activity: recentHires.map((hire) => ({
      id: hire.id,
      label: [hire.first_name, hire.last_name].filter(Boolean).join(" ").trim() || "dashboard.dept.activity.newHire",
      timestamp: hire.created_at ?? undefined,
    })),
    health: {
      status: pendingLeaves > 5 ? "degraded" : "ok",
      notes: pendingLeaves > 0 ? ["dashboard.dept.health.pendingLeaves"] : [],
    },
    metadata: { source: "rh-live", generatedAt: now.toISOString(), placeholder: false },
  };
}
