import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import type { CloudOperationalOverview } from "@/modules/cloud/types/domain";

export async function getCloudOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<CloudOperationalOverview> {
  const [regions, profiles, edge, workloads, jobs] = await Promise.all([
    supabase.from("erp_cloud_regions").select("id", { count: "exact", head: true }),
    supabase.from("erp_cloud_tenant_region_profiles").select("tenant_id", { count: "exact", head: true }),
    supabase.from("erp_cloud_edge_services").select("id", { count: "exact", head: true }),
    supabase.from("erp_cloud_workload_policies").select("id", { count: "exact", head: true }),
    supabase
      .from("erp_infrastructure_jobs")
      .select("id", { count: "exact", head: true })
      .eq("queue_key", INFRA_QUEUE_KEYS.cloud)
      .eq("status", "pending"),
  ]);

  const errors = [regions.error, profiles.error, edge.error, workloads.error, jobs.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    regionsCount: regions.count ?? 0,
    tenantRegionProfilesCount: profiles.count ?? 0,
    edgeServicesCount: edge.count ?? 0,
    workloadPoliciesCount: workloads.count ?? 0,
    cloudPendingJobs: jobs.count ?? 0,
  };
}
