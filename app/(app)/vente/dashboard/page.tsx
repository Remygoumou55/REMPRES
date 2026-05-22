import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";
import { getVenteCockpitPayload } from "@/lib/vente/runtime/vente-cockpit-payload";
import { VenteCockpitClient } from "@/modules/vente/components/cockpit/VenteCockpitClient";

/**
 * B2.3 — Cockpit manager Vente (données live via getVenteCockpitPayload, pas placeholder M3).
 */
export default async function VenteDashboardPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseServerClient();
  const userDisplayName = await getCachedProfileDisplayName(user.id);
  const payload = await getVenteCockpitPayload(supabase, user.id, userDisplayName);

  return <VenteCockpitClient payload={payload} />;
}
