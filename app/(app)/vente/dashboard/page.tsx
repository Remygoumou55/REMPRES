import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getCachedProfileDisplayName } from "@/lib/server/profile-display";
import { getVenteCockpitPayload } from "@/lib/vente/runtime/vente-cockpit-payload";

const VenteCockpitClient = dynamic(
  () =>
    import("@/modules/vente/components/cockpit/VenteCockpitClient").then((m) => ({
      default: m.VenteCockpitClient,
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
