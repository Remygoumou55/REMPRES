import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

export async function executeEcosystemFederationDigest(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  const [partners, routes] = await Promise.all([
    admin.from("erp_ecosystem_partners").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("erp_ecosystem_connector_routes").select("id", { count: "exact", head: true }).eq("enabled", true),
  ]);

  if (partners.error) throw new Error(partners.error.message);
  if (routes.error) throw new Error(routes.error.message);

  infraLogInfo("ecosystem.federation_digest.complete", {
    jobId: job.id,
    partnersActive: partners.count ?? 0,
    connectorRoutesEnabled: routes.count ?? 0,
    tenantId: job.tenant_id,
  });
}
