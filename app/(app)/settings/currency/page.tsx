import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { appConfig } from "@/lib/config";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsSectionShell } from "@/components/settings/SettingsSectionShell";

export const metadata = { title: "Devise — Paramètres" };

export default async function SettingsCurrencyPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!(await isAdminRole(data.user.id))) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader title="Devise" subtitle="Devise de référence ERP et cohérence d'affichage globale." />
      <SettingsSectionShell
        title="Devise ERP"
        subtitle="La devise interne de consolidation reste le franc guinéen (GNF). Les devises d'affichage commerciales sont pilotées via les taux."
      >
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Coins size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-darktext">Devise de référence</p>
            <p className="text-2xl font-bold tabular-nums text-primary">GNF</p>
            <p className="mt-1 text-xs text-gray-500">
              Application {appConfig.name} — {appConfig.country}
            </p>
          </div>
        </div>
        <Link
          href={SETTINGS_OFFICIAL_ROUTES.rates}
          className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Gérer les taux de change →
        </Link>
      </SettingsSectionShell>
    </div>
  );
}
