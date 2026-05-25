/**
 * Bloc 3 Étape 8 — Integration framework (connect tenant ↔ integration definition).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import { emitPlatformIntegrationConnected } from "@/lib/erp-core/events/integrations/platform-events";

export async function connectPlatformIntegration(params: {
  admin: SupabaseClient<Database>;
  actorUserId: string;
  tenantId: string;
  integrationKey: string;
  connectorKey: string;
  credentialRef?: string | null;
}): Promise<string> {
  const { data: def, error: defErr } = await params.admin
    .from("erp_platform_integration_definitions")
    .select("integration_key")
    .eq("integration_key", params.integrationKey)
    .eq("is_active", true)
    .maybeSingle();

  if (defErr) throw new Error(defErr.message);
  if (!def) throw new Error(`integration_not_found:${params.integrationKey}`);

  const { data: row, error } = await params.admin
    .from("erp_platform_connector_instances")
    .upsert(
      {
        tenant_id: params.tenantId,
        connector_key: params.connectorKey,
        integration_key: params.integrationKey,
        connection_state: "connected",
        health_score: 85,
        retry_count: 0,
        credential_ref: params.credentialRef ?? null,
        last_sync_at: new Date().toISOString(),
        metadata: { connected_by: params.actorUserId } as Json,
      },
      { onConflict: "tenant_id,connector_key" },
    )
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await emitPlatformIntegrationConnected({
    actorUserId: params.actorUserId,
    integrationKey: params.integrationKey,
    connectorKey: params.connectorKey,
  });

  return row.id;
}
