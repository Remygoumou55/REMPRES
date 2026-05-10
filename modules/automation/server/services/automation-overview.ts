import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type AutomationOperationalOverview = {
  definitionsActive: number;
  runsOpen: number;
  schedulesDue: number;
  events24h: number;
};

export async function getAutomationOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<AutomationOperationalOverview> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  const [defs, runs, sched, evs] = await Promise.all([
    supabase
      .from("erp_automation_workflow_definitions")
      .select("workflow_key", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("erp_automation_workflow_runs")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "running", "waiting_approval"]),
    supabase
      .from("erp_automation_schedules")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .lte("next_run_at", nowIso),
    supabase
      .from("erp_automation_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  const errors = [defs.error, runs.error, sched.error, evs.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    definitionsActive: defs.count ?? 0,
    runsOpen: runs.count ?? 0,
    schedulesDue: sched.count ?? 0,
    events24h: evs.count ?? 0,
  };
}
