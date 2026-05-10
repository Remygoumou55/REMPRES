import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import type { MultitenantOperationalOverview } from "@/modules/multitenant/types/domain";

export async function getMultitenantOperationalOverview(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<MultitenantOperationalOverview> {
  const [tenants, memberships, quotas, jobs] = await Promise.all([
    supabase.from("erp_tenants").select("id", { count: "exact", head: true }),
    supabase.from("erp_tenant_memberships").select("tenant_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("erp_tenant_quotas").select("tenant_id", { count: "exact", head: true }),
    supabase
      .from("erp_infrastructure_jobs")
      .select("id", { count: "exact", head: true })
      .eq("queue_key", INFRA_QUEUE_KEYS.multitenant)
      .eq("status", "pending"),
  ]);

  const errors = [tenants.error, memberships.error, quotas.error, jobs.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    tenantsVisible: tenants.count ?? 0,
    membershipsForUser: memberships.count ?? 0,
    quotasRows: quotas.count ?? 0,
    multitenantPendingJobs: jobs.count ?? 0,
  };
}
