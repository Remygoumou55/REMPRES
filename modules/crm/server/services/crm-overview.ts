import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { assertCrmRuntimeReadAccess } from "@/lib/vente/runtime/vente-runtime-security";

export const CRM_OPERATIONAL_KPI_SOURCE = "crm-operational-runtime-v1" as const;

export type CrmOperationalOverview = {
  source: typeof CRM_OPERATIONAL_KPI_SOURCE;
  activeLeads: number;
  openOpportunities: number;
  openQuotes: number;
  openActivities: number;
  weightedPipelineGnf: number;
};

async function fetchOpenPipelineStageIds(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .select("id")
    .eq("is_active", true)
    .eq("is_terminal_win", false)
    .eq("is_terminal_loss", false);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.id);
}

export async function getCrmOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<CrmOperationalOverview> {
  const openStageIds = await fetchOpenPipelineStageIds(supabase);

  const oppsQuery = supabase
    .from("crm_opportunities")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  const [leads, opps, quotes, acts, weighted] = await Promise.all([
    supabase
      .from("crm_leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["new", "contacted", "qualified"]),
    openStageIds.length > 0
      ? oppsQuery.in("stage_id", openStageIds)
      : oppsQuery.eq("stage_id", "00000000-0000-0000-0000-000000000000"),
    supabase
      .from("crm_quotes")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["draft", "sent"]),
    supabase
      .from("crm_activities")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .is("completed_at", null),
    supabase.from("v_crm_pipeline_weighted").select("weighted_amount_gnf"),
  ]);

  const errors = [leads.error, opps.error, quotes.error, acts.error, weighted.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  const weightedSum = (weighted.data ?? []).reduce((acc, row) => acc + Number(row.weighted_amount_gnf ?? 0), 0);

  return {
    source: CRM_OPERATIONAL_KPI_SOURCE,
    activeLeads: leads.count ?? 0,
    openOpportunities: opps.count ?? 0,
    openQuotes: quotes.count ?? 0,
    openActivities: acts.count ?? 0,
    weightedPipelineGnf: Math.round(weightedSum * 100) / 100,
  };
}

/** B2.0 — lecture CRM avec SEC-1 (couche applicative). */
export async function getCrmOperationalOverviewGuarded(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CrmOperationalOverview> {
  await assertCrmRuntimeReadAccess(userId);
  return getCrmOperationalOverview(supabase);
}
