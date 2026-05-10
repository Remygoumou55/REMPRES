import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { EcosystemOperationalOverview } from "@/modules/ecosystem/types/domain";

export async function getEcosystemOperationalOverview(
  supabase: SupabaseClient<Database>,
): Promise<EcosystemOperationalOverview> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [partners, links, certs, fed] = await Promise.all([
    supabase.from("erp_ecosystem_partners").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("erp_ecosystem_partner_tenant_links").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("erp_ecosystem_certifications").select("id", { count: "exact", head: true }).eq("status", "certified"),
    supabase.from("erp_ecosystem_federation_events").select("id", { count: "exact", head: true }).gte("created_at", since),
  ]);

  const errors = [partners.error, links.error, certs.error, fed.error].filter(Boolean);
  if (errors.length) throw new Error(errors.map((e) => e?.message).join("; "));

  return {
    partnersActive: partners.count ?? 0,
    tenantPartnerLinks: links.count ?? 0,
    certificationsCertified: certs.count ?? 0,
    federationEvents24h: fed.count ?? 0,
  };
}
