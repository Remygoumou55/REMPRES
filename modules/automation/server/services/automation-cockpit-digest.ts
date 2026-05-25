import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getAutomationOperationalOverview } from "@/modules/automation/server/services/automation-overview";
import { buildAutomationObservabilityMetrics } from "@/modules/automation/server/services/automation-observability-metrics";
import {
  AUTOMATION_GOVERNANCE_MAP,
  ERP_AUTOMATION_GOVERNANCE_SUMMARY,
} from "@/lib/erp-core/events/automation/automation-governance";
import { getRecentAutomationTraces } from "@/lib/erp-core/events/automation/automation-trace-log";
import { emitAutomationReportGenerated } from "@/lib/erp-core/events/integrations/automation-events";

export type AutomationCockpitDigest = {
  overview: Awaited<ReturnType<typeof getAutomationOperationalOverview>>;
  metrics: Awaited<ReturnType<typeof buildAutomationObservabilityMetrics>>;
  activeRules: number;
  governanceEntries: number;
  recentTraces: ReturnType<typeof getRecentAutomationTraces>;
};

export async function buildAutomationCockpitDigest(
  supabase: SupabaseClient<Database>,
): Promise<AutomationCockpitDigest> {
  const [overview, metrics] = await Promise.all([
    getAutomationOperationalOverview(supabase),
    buildAutomationObservabilityMetrics(supabase),
  ]);

  return {
    overview,
    metrics,
    activeRules: ERP_AUTOMATION_GOVERNANCE_SUMMARY.activeRules,
    governanceEntries: AUTOMATION_GOVERNANCE_MAP.length,
    recentTraces: getRecentAutomationTraces(30),
  };
}

export async function publishAutomationCockpitDigest(
  supabase: SupabaseClient<Database>,
  actorUserId: string,
): Promise<AutomationCockpitDigest> {
  const digest = await buildAutomationCockpitDigest(supabase);
  const reportId = crypto.randomUUID();
  await emitAutomationReportGenerated({
    actorUserId,
    reportId,
    successRatePct: digest.metrics.successRatePct,
    executions24h: digest.metrics.executions24h,
  });
  return digest;
}
