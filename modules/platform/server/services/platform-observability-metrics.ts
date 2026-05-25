import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type PlatformObservabilityMetrics = {
  apisActive: number;
  connectorsConnected: number;
  connectorsDegraded: number;
  connectorFailures24h: number;
  apiInvocations24h: number;
  pluginErrorsEstimate: number;
};

export async function buildPlatformObservabilityMetrics(
  supabase: SupabaseClient<Database>,
): Promise<PlatformObservabilityMetrics> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [apis, connected, degraded, logs, audit] = await Promise.all([
    supabase
      .from("erp_platform_api_registry")
      .select("api_key", { count: "exact", head: true })
      .eq("lifecycle_status", "active"),
    supabase
      .from("erp_platform_connector_instances")
      .select("id", { count: "exact", head: true })
      .eq("connection_state", "connected"),
    supabase
      .from("erp_platform_connector_instances")
      .select("id", { count: "exact", head: true })
      .in("connection_state", ["degraded", "failed"]),
    supabase
      .from("erp_platform_connector_logs")
      .select("id", { count: "exact", head: true })
      .eq("outcome", "failure")
      .gte("created_at", since),
    supabase
      .from("erp_platform_api_audit_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  const errors = [apis.error, connected.error, degraded.error, logs.error, audit.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    apisActive: apis.count ?? 0,
    connectorsConnected: connected.count ?? 0,
    connectorsDegraded: degraded.count ?? 0,
    connectorFailures24h: logs.count ?? 0,
    apiInvocations24h: audit.count ?? 0,
    pluginErrorsEstimate: degraded.count ?? 0,
  };
}
