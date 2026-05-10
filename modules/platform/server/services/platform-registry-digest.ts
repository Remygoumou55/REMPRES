import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { infraLogInfo } from "@/modules/infrastructure/utils/infrastructure-log";

/** Agrège registre / installs — point d’extension pour federation workflows et routing événements. */
export async function executePlatformRegistryDigest(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  const [listed, installs] = await Promise.all([
    admin.from("erp_platform_catalog_plugins").select("id", { count: "exact", head: true }).eq("is_listed", true),
    admin.from("erp_platform_plugin_installations").select("id", { count: "exact", head: true }),
  ]);

  if (listed.error) throw new Error(listed.error.message);
  if (installs.error) throw new Error(installs.error.message);

  infraLogInfo("platform.registry_digest.complete", {
    jobId: job.id,
    catalogListed: listed.count ?? 0,
    installations: installs.count ?? 0,
    tenantId: job.tenant_id,
  });
}
