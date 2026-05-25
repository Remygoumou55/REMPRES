/**
 * Bloc 3 — Analytics CRM opérationnels (données live).
 */

import { format, startOfMonth } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { emitCrmReportGenerated } from "@/lib/erp-core/events/integrations/crm-events";
import { getCrmOperationalOverview } from "@/modules/crm/server/services/crm-overview";
import { recordCrmGovernanceAudit } from "@/modules/crm/server/services/crm-audit-hook";

export const CRM_ANALYTICS_SOURCE = "crm-operational-analytics-bloc3-v1" as const;

export type CrmOperationalAnalytics = {
  source: typeof CRM_ANALYTICS_SOURCE;
  reportId: string;
  periodStart: string;
  overview: {
    activeLeads: number;
    openOpportunities: number;
    openQuotes: number;
    openActivities: number;
    weightedPipelineGnf: number;
  };
  conversion: {
    totalLeads: number;
    convertedLeads: number;
    conversionRatePct: number | null;
  };
  pipeline: {
    rawValueGnf: number;
    weightedValueGnf: number;
    openDealCount: number;
  };
  deals: {
    wonCount: number;
    lostCount: number;
    winRatePct: number | null;
    closedWonGnf: number;
  };
  sales: {
    crmLinkedSaleCount: number;
    crmLinkedRevenueGnf: number;
  };
  forecast: {
    projectedWeightedGnf: number;
    snapshotHint: string;
  };
  generatedAt: string;
};

async function sumPipeline(
  supabase: SupabaseClient<Database>,
): Promise<{ raw: number; weighted: number; count: number }> {
  const { data, error } = await supabase.from("v_crm_pipeline_weighted").select("*");
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return {
    raw: rows.reduce((s, r) => s + Number(r.amount_estimated_gnf ?? 0), 0),
    weighted: rows.reduce((s, r) => s + Number(r.weighted_amount_gnf ?? 0), 0),
    count: rows.length,
  };
}

export async function buildCrmOperationalAnalytics(
  supabase: SupabaseClient<Database>,
): Promise<CrmOperationalAnalytics> {
  const periodStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const overview = await getCrmOperationalOverview(supabase);
  const pipeline = await sumPipeline(supabase);

  const { data: winStages } = await supabase
    .from("crm_pipeline_stages")
    .select("id")
    .eq("is_terminal_win", true);
  const { data: lossStages } = await supabase
    .from("crm_pipeline_stages")
    .select("id")
    .eq("is_terminal_loss", true);
  const winIds = (winStages ?? []).map((s) => s.id);
  const lossIds = (lossStages ?? []).map((s) => s.id);

  const wonQuery =
    winIds.length > 0
      ? supabase
          .from("crm_opportunities")
          .select("amount_estimated_gnf")
          .is("deleted_at", null)
          .in("stage_id", winIds)
      : Promise.resolve({ data: [], error: null });
  const lostQuery =
    lossIds.length > 0
      ? supabase
          .from("crm_opportunities")
          .select("id")
          .is("deleted_at", null)
          .in("stage_id", lossIds)
      : Promise.resolve({ data: [], error: null });

  const [leadsAll, leadsConverted, wonAmount, lostOpps, salesLinked] = await Promise.all([
    supabase.from("crm_leads").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("crm_leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("status", "converted"),
    wonQuery,
    lostQuery,
    supabase
      .from("sales")
      .select("total_amount_gnf")
      .or("crm_opportunity_id.not.is.null,crm_quote_id.not.is.null")
      .gte("created_at", `${periodStart}T00:00:00`),
  ]);

  const totalLeads = leadsAll.count ?? 0;
  const convertedLeads = leadsConverted.count ?? 0;
  const wonCount = wonAmount.data?.length ?? 0;
  const lostCount = lostOpps.data?.length ?? 0;
  const closedWonGnf = (wonAmount.data ?? []).reduce(
    (s, r) => s + Number(r.amount_estimated_gnf ?? 0),
    0,
  );
  const crmLinkedRevenueGnf = (salesLinked.data ?? []).reduce(
    (s, r) => s + Number(r.total_amount_gnf ?? 0),
    0,
  );
  const closedTotal = wonCount + lostCount;

  return {
    source: CRM_ANALYTICS_SOURCE,
    reportId: `crm-analytics-${periodStart}`,
    periodStart,
    overview,
    conversion: {
      totalLeads,
      convertedLeads,
      conversionRatePct:
        totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : null,
    },
    pipeline: {
      rawValueGnf: Math.round(pipeline.raw * 100) / 100,
      weightedValueGnf: Math.round(pipeline.weighted * 100) / 100,
      openDealCount: pipeline.count,
    },
    deals: {
      wonCount,
      lostCount,
      winRatePct: closedTotal > 0 ? Math.round((wonCount / closedTotal) * 1000) / 10 : null,
      closedWonGnf: Math.round(closedWonGnf * 100) / 100,
    },
    sales: {
      crmLinkedSaleCount: salesLinked.data?.length ?? 0,
      crmLinkedRevenueGnf: Math.round(crmLinkedRevenueGnf * 100) / 100,
    },
    forecast: {
      projectedWeightedGnf: Math.round(pipeline.weighted * 100) / 100,
      snapshotHint: "refreshCrmForecastSnapshot pour historiser",
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function refreshCrmForecastSnapshot(
  supabase: SupabaseClient<Database>,
  ownerId?: string | null,
): Promise<{ id: string }> {
  const analytics = await buildCrmOperationalAnalytics(supabase);
  const periodStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("crm_forecast_snapshots")
    .insert({
      period_start: periodStart,
      grain: "monthly",
      owner_id: ownerId ?? null,
      pipeline_raw_gnf: analytics.pipeline.rawValueGnf,
      weighted_pipeline_gnf: analytics.pipeline.weightedValueGnf,
      closed_won_gnf: analytics.deals.closedWonGnf,
      metadata: {
        source: CRM_ANALYTICS_SOURCE,
        win_rate_pct: analytics.deals.winRatePct,
        conversion_rate_pct: analytics.conversion.conversionRatePct,
      },
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function generateCrmOperationalAnalyticsReport(
  userId: string,
): Promise<{ success: true; analytics: CrmOperationalAnalytics } | { success: false; error: string }> {
  try {
    const supabase = getSupabaseServerClient();
    const analytics = await buildCrmOperationalAnalytics(supabase);

    await Promise.all([
      emitCrmReportGenerated({
        actorUserId: userId,
        reportId: analytics.reportId,
        reportType: "crm.operational.analytics",
      }),
      recordCrmGovernanceAudit({
        actionType: "crm.report.generate",
        entityType: "crm_report",
        entityId: analytics.reportId,
        afterSnapshot: {
          conversion_rate_pct: analytics.conversion.conversionRatePct,
          weighted_pipeline_gnf: analytics.pipeline.weightedValueGnf,
          win_rate_pct: analytics.deals.winRatePct,
        },
      }),
    ]);

    return { success: true, analytics };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Erreur analytics CRM.",
    };
  }
}
