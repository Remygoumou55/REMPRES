import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type CrmOperationalOverview = {
  activeLeads: number;
  openOpportunities: number;
  openQuotes: number;
  openActivities: number;
  weightedPipelineGnf: number;
};

export async function getCrmOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<CrmOperationalOverview> {
  const [leads, opps, quotes, acts, weighted] = await Promise.all([
    supabase
      .from("crm_leads")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["new", "contacted", "qualified"]),
    supabase
      .from("crm_opportunities")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
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
    activeLeads: leads.count ?? 0,
    openOpportunities: opps.count ?? 0,
    openQuotes: quotes.count ?? 0,
    openActivities: acts.count ?? 0,
    weightedPipelineGnf: Math.round(weightedSum * 100) / 100,
  };
}
