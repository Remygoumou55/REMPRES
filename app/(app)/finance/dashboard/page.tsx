import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";
import { getFinanceCockpitPayload } from "@/lib/finance/runtime/finance-cockpit-payload";

const FinanceCockpitClient = dynamic(
  () =>
    import("@/modules/finance/components/cockpit/FinanceCockpitClient").then((m) => ({
      default: m.FinanceCockpitClient,
    })),
  {
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-gray-500">
        Chargement du cockpit…
      </div>
    ),
  },
);

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
