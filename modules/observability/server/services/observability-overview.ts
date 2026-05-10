import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type ObservabilityOperationalOverview = {
  latestHealthScore: number | null;
  openIncidents: number;
  openAnomalies: number;
  traceEvents24h: number;
};

export async function getObservabilityOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<ObservabilityOperationalOverview> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [latestHealth, incidents, anomalies, traces] = await Promise.all([
    supabase
      .from("erp_observability_health_snapshots")
      .select("health_score")
      .eq("scope_key", "global")
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("erp_observability_incidents")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "investigating"]),
    supabase
      .from("erp_observability_anomalies")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("erp_observability_trace_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  const errors = [latestHealth.error, incidents.error, anomalies.error, traces.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    latestHealthScore: latestHealth.data?.health_score ?? null,
    openIncidents: incidents.count ?? 0,
    openAnomalies: anomalies.count ?? 0,
    traceEvents24h: traces.count ?? 0,
  };
}
