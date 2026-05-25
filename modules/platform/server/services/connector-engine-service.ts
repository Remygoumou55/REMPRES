/**
 * Bloc 3 Étape 8 — Connector engine (health probe, retry, logs — gouverné).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  emitPlatformConnectorHealthDegraded,
  emitPlatformConnectorSyncCompleted,
} from "@/lib/erp-core/events/integrations/platform-events";

const MAX_RETRY_BEFORE_DEGRADED = 3;

export async function runConnectorHealthProbe(
  admin: SupabaseClient<Database>,
  actorUserId: string,
  instanceId: string,
): Promise<{ healthScore: number; state: string }> {
  const started = Date.now();
  const { data: row, error } = await admin
    .from("erp_platform_connector_instances")
    .select("id,connection_state,retry_count,health_score")
    .eq("id", instanceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) throw new Error("connector_instance_not_found");

  const retry = (row.retry_count ?? 0) + 1;
  const healthScore =
    row.connection_state === "connected"
      ? Math.max(40, 100 - retry * 15)
      : Math.max(10, 60 - retry * 20);

  const nextState =
    retry >= MAX_RETRY_BEFORE_DEGRADED
      ? "degraded"
      : row.connection_state === "disconnected"
        ? "connecting"
        : "connected";

  const { error: updErr } = await admin
    .from("erp_platform_connector_instances")
    .update({
      retry_count: retry,
      health_score: healthScore,
      connection_state: nextState,
      last_sync_at: new Date().toISOString(),
    })
    .eq("id", instanceId);

  if (updErr) throw new Error(updErr.message);

  const latencyMs = Date.now() - started;
  const outcome = nextState === "degraded" ? "failure" : "health_probe";

  await admin.from("erp_platform_connector_logs").insert({
    connector_instance_id: instanceId,
    outcome,
    latency_ms: latencyMs,
    detail: `health_probe state=${nextState}`,
    metadata: { health_score: healthScore, retry },
  });

  if (nextState === "degraded") {
    await emitPlatformConnectorHealthDegraded({
      actorUserId,
      connectorInstanceId: instanceId,
      healthScore,
    });
  } else {
    await emitPlatformConnectorSyncCompleted({
      actorUserId,
      connectorInstanceId: instanceId,
      latencyMs,
    });
  }

  return { healthScore, state: nextState };
}

export async function probeAllConnectorsForTenant(
  admin: SupabaseClient<Database>,
  actorUserId: string,
  tenantId: string,
): Promise<number> {
  const { data, error } = await admin
    .from("erp_platform_connector_instances")
    .select("id")
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);
  let count = 0;
  for (const row of data ?? []) {
    await runConnectorHealthProbe(admin, actorUserId, row.id);
    count += 1;
  }
  return count;
}
