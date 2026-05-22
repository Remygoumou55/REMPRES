import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";
import { getFinanceCockpitPayload } from "@/lib/finance/runtime/finance-cockpit-payload";
import { FinanceCockpitClient } from "@/modules/finance/components/cockpit/FinanceCockpitClient";

/**
 * B3 — Cockpit manager Finance (données live via getFinanceCockpitPayload, standard B2.4).
 */
export default async function FinanceDashboardPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseServerClient();
  const userDisplayName = await getCachedProfileDisplayName(user.id);
  const payload = await getFinanceCockpitPayload(supabase, user.id, userDisplayName);

  return <FinanceCockpitClient payload={payload} />;
}
