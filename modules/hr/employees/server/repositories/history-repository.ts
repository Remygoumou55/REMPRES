import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { EmployeeHistoryEvent } from "@/modules/hr/employees/types";

export async function listEmployeeHistory(employeeId: string): Promise<EmployeeHistoryEvent[]> {
  const supabase = getSupabaseServerClient();
  const [customHistory, activityLogs] = await Promise.all([
    supabase
      .from("rh_employee_history")
      .select("id,employee_id,event_type,event_label,created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("activity_logs")
      .select("id,target_id,action_key,created_at")
      .eq("target_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const base: EmployeeHistoryEvent[] = (customHistory.data ?? []).map((event) => ({
    id: event.id,
    employeeId: event.employee_id,
    eventType: event.event_type,
    eventLabel: event.event_label,
    createdAt: event.created_at,
  }));

  const derived: EmployeeHistoryEvent[] = (activityLogs.data ?? []).map((event) => ({
    id: `activity-${event.id}`,
    employeeId,
    eventType: "activity_log",
    eventLabel: event.action_key,
    createdAt: event.created_at,
  }));

  return [...base, ...derived].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

