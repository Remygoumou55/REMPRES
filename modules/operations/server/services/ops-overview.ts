import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type OperationsOperationalOverview = {
  openTasks: number;
  blockedTasks: number;
  activeProjects: number;
  activeWorkflows: number;
  delayedDeliveries: number;
  completionRatePct: number;
};

export async function getOperationsOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<OperationsOperationalOverview> {
  const [openTasks, blocked, projects, workflows, delayed, completed, totalDeliveries] =
    await Promise.all([
      supabase
        .from("erp_ops_tasks")
        .select("id", { count: "exact", head: true })
        .in("status", ["todo", "in_progress"]),
      supabase
        .from("erp_ops_tasks")
        .select("id", { count: "exact", head: true })
        .eq("status", "blocked"),
      supabase
        .from("erp_ops_projects")
        .select("id", { count: "exact", head: true })
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
    ]);

  const errors = [
    openTasks.error,
    blocked.error,
    projects.error,
    workflows.error,
    delayed.error,
    completed.error,
    totalDeliveries.error,
  ].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  const total = totalDeliveries.count ?? 0;
  const done = completed.count ?? 0;
  const completionRatePct = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    openTasks: openTasks.count ?? 0,
    blockedTasks: blocked.count ?? 0,
    activeProjects: projects.count ?? 0,
    activeWorkflows: workflows.count ?? 0,
    delayedDeliveries: delayed.count ?? 0,
    completionRatePct,
  };
}
