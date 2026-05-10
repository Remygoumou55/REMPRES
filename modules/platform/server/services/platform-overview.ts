import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { PlatformOperationalOverview } from "@/modules/platform/types/domain";

export async function getPlatformOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<PlatformOperationalOverview> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [catalog, installations, partners, events] = await Promise.all([
    supabase.from("erp_platform_catalog_plugins").select("id", { count: "exact", head: true }).eq("is_listed", true),
    supabase.from("erp_platform_plugin_installations").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("erp_platform_partner_connections").select("id", { count: "exact", head: true }),
    supabase.from("erp_platform_external_event_outbox").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  const errors = [catalog.error, installations.error, partners.error, events.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    catalogListed: catalog.count ?? 0,
    installationsActive: installations.count ?? 0,
    partnerConnections: partners.count ?? 0,
    externalEvents24h: events.count ?? 0,
  };
}
