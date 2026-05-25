import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getRecentAutomationTraces } from "@/lib/erp-core/events/automation/automation-trace-log";

export type AutomationObservabilityMetrics = {
  executions24h: number;
  successCount24h: number;
  failureCount24h: number;
  successRatePct: number;
  traceRingSize: number;
  avgLatencyMsEstimate: number | null;
};

export async function buildAutomationObservabilityMetrics(
  supabase: SupabaseClient<Database>,
): Promise<AutomationObservabilityMetrics> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("erp_automation_rule_executions")
    .select("outcome, created_at")
    .gte("created_at", since);

  if (error) {
    const traces = getRecentAutomationTraces(200);
    const executed = traces.filter((t) => t.outcome === "executed").length;
    const failed = traces.filter((t) => t.outcome === "error").length;
    const total = executed + failed;
    return {
      executions24h: traces.length,
      successCount24h: executed,
      failureCount24h: failed,
      successRatePct: total > 0 ? Math.round((executed / total) * 100) : 100,
      traceRingSize: traces.length,
      avgLatencyMsEstimate: null,
    };
  }

  const rows = data ?? [];
  const executed = rows.filter((r) => r.outcome === "executed").length;
  const failed = rows.filter((r) => r.outcome === "error").length;
  const total = executed + failed;

  return {
    executions24h: rows.length,
    successCount24h: executed,
    failureCount24h: failed,
    successRatePct: total > 0 ? Math.round((executed / total) * 100) : 100,
    traceRingSize: getRecentAutomationTraces(200).length,
    avgLatencyMsEstimate: null,
  };
}
