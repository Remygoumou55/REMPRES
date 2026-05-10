import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

/**
 * Digest batch cloud : agrège les compteurs catalogue / edge / politiques et journalise un événement append-only.
 * Extension naturelle : corrélations observabilité, routage analytics, checkpoints DR — sans toucher aux domaines métier.
 */
export async function executeCloudOperationsDigest(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  const [regions, profiles, edge, workloads, checkpoints] = await Promise.all([
    admin.from("erp_cloud_regions").select("id", { count: "exact", head: true }),
    admin.from("erp_cloud_tenant_region_profiles").select("tenant_id", { count: "exact", head: true }),
    admin.from("erp_cloud_edge_services").select("id", { count: "exact", head: true }),
    admin.from("erp_cloud_workload_policies").select("id", { count: "exact", head: true }),
    admin.from("erp_cloud_recovery_checkpoints").select("id", { count: "exact", head: true }),
  ]);

  const err = [regions.error, profiles.error, edge.error, workloads.error, checkpoints.error].find(Boolean);
  if (err) throw new Error(err.message);

  const payload = {
    regions: regions.count ?? 0,
    tenant_region_profiles: profiles.count ?? 0,
    edge_services: edge.count ?? 0,
    workload_policies: workloads.count ?? 0,
    recovery_checkpoints: checkpoints.count ?? 0,
    scoped_tenant_id: job.tenant_id,
  };

  const { error: insertErr } = await admin.from("erp_cloud_operations_events").insert({
    tenant_id: job.tenant_id,
    region_id: null,
    event_kind: "cloud.operations_digest",
    payload,
    correlation_id: job.id,
  });

  if (insertErr) throw new Error(insertErr.message);

  infraLogInfo("cloud.operations_digest.complete", {
    jobId: job.id,
    ...payload,
  });
}
