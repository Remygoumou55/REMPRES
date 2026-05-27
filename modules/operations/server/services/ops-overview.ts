import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type OperationsOperationalOverview = {
  /** Backlog : todo + en cours (compat KPI existants) */
  openTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  activeProjects: number;
  activeWorkflows: number;
  delayedDeliveries: number;
  completionRatePct: number;
  doneThisMonth: number;
};

export async function getOperationsOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<OperationsOperationalOverview> {
  const now = new Date().toISOString();
  const monthStart = `${new Date().toISOString().slice(0, 7)}-01T00:00:00`;

  const [
    todoTasks,
    inProgress,
    blocked,
    overdue,
    projects,
    workflows,
    delayed,
    completed,
    totalDeliveries,
    doneThisMonth,
  ] = await Promise.all([
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "todo"),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "in_progress"),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "blocked"),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .lt("due_at", now)
      .not("status", "in", "(done,cancelled)"),
    supabase
      .from("erp_ops_projects")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "active"),
    supabase
      .from("erp_ops_workflows")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "active", "review"]),
    supabase
      .from("erp_ops_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "delayed"),
    supabase
      .from("erp_ops_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase.from("erp_ops_deliveries").select("id", { count: "exact", head: true }),
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "done")
      .gte("completed_at", monthStart),
  ]);

  const errors = [
    todoTasks.error,
    inProgress.error,
    blocked.error,
    overdue.error,
    projects.error,
    workflows.error,
    delayed.error,
    completed.error,
    totalDeliveries.error,
    doneThisMonth.error,
  ].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  const total = totalDeliveries.count ?? 0;
  const done = completed.count ?? 0;
  const completionRatePct = total > 0 ? Math.round((done / total) * 100) : 0;
  const todo = todoTasks.count ?? 0;
  const inProg = inProgress.count ?? 0;

  return {
    openTasks: todo + inProg,
    inProgressTasks: inProg,
    blockedTasks: blocked.count ?? 0,
    overdueTasks: overdue.count ?? 0,
    activeProjects: projects.count ?? 0,
    activeWorkflows: workflows.count ?? 0,
    delayedDeliveries: delayed.count ?? 0,
    completionRatePct,
    doneThisMonth: doneThisMonth.count ?? 0,
  };
}
