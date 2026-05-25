/**
 * Bloc 3 — Analytics Operations (données live).
 */

import { format, startOfMonth } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { emitOpsReportGenerated } from "@/lib/erp-core/events/integrations/ops-events";
import { getOperationsOperationalOverview } from "@/modules/operations/server/services/ops-overview";
import { recordOpsGovernanceAudit } from "@/modules/operations/server/services/ops-audit-hook";
import { OPS_WRITE_ACTIONS } from "@/lib/operations/runtime/operations-write-governance";

export const OPS_ANALYTICS_SOURCE = "ops-operational-analytics-bloc3-v1" as const;

export type OpsOperationalAnalytics = {
  source: typeof OPS_ANALYTICS_SOURCE;
  reportId: string;
  periodStart: string;
  overview: Awaited<ReturnType<typeof getOperationsOperationalOverview>>;
  tasks: { backlog: number; doneThisMonth: number };
  workflows: { inReview: number; approved: number };
  delivery: { delayed: number; completionRatePct: number };
  generatedAt: string;
};

export async function buildOpsOperationalAnalytics(
  supabase: SupabaseClient<Database>,
): Promise<OpsOperationalAnalytics> {
  const periodStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthStartIso = `${periodStart}T00:00:00`;
  const overview = await getOperationsOperationalOverview(supabase);

  const [doneTasks, inReviewWf, approvedWf] = await Promise.all([
    supabase
      .from("erp_ops_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "done")
      .gte("completed_at", monthStartIso),
    supabase
      .from("erp_ops_workflows")
      .select("id", { count: "exact", head: true })
      .eq("status", "review"),
    supabase
      .from("erp_ops_workflows")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
  ]);

  if (doneTasks.error) throw new Error(doneTasks.error.message);
  if (inReviewWf.error) throw new Error(inReviewWf.error.message);
  if (approvedWf.error) throw new Error(approvedWf.error.message);

  return {
    source: OPS_ANALYTICS_SOURCE,
    reportId: `ops-analytics-${periodStart}`,
    periodStart,
    overview,
    tasks: { backlog: overview.openTasks, doneThisMonth: doneTasks.count ?? 0 },
    workflows: { inReview: inReviewWf.count ?? 0, approved: approvedWf.count ?? 0 },
    delivery: {
      delayed: overview.delayedDeliveries,
      completionRatePct: overview.completionRatePct,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function generateOpsOperationalReport(userId: string): Promise<OpsOperationalAnalytics> {
  const supabase = getSupabaseServerClient();
  const analytics = await buildOpsOperationalAnalytics(supabase);

  await Promise.all([
    emitOpsReportGenerated({
      actorUserId: userId,
      reportId: analytics.reportId,
      periodStart: analytics.periodStart,
    }),
    recordOpsGovernanceAudit({
      actionType: OPS_WRITE_ACTIONS.REPORT_GENERATE,
      entityType: "ops_analytics_report",
      entityId: analytics.reportId,
      afterSnapshot: {
        backlog: analytics.tasks.backlog,
        delivery_rate: analytics.delivery.completionRatePct,
      },
    }),
  ]);

  return analytics;
}
