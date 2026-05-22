import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { getSettingsGovernanceOverview } from "@/lib/server/settings-governance-overview";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsGovernanceHub } from "@/components/settings/SettingsGovernanceHub";
import { SettingsUserPreferences } from "@/components/settings/SettingsUserPreferences";
import { NAV_LABELS } from "@/lib/constants/nav-labels";

export const metadata: Metadata = {
  title: "Paramètres — gouvernance",
  description: "Centre de configuration ERP — utilisateurs, permissions, sécurité et paramètres globaux.",
};

export default async function SettingsPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [admin, superAdmin] = await Promise.all([isAdminRole(data.user.id), isSuperAdmin(data.user.id)]);

  if (superAdmin || admin) {
    const overview = await getSettingsGovernanceOverview();
    return (
      <div className="page-wrapper">
        <PageHeader
          title="Paramètres — gouvernance ERP"
          subtitle="Centre de configuration : utilisateurs, permissions, sécurité, devise, taux, notifications et système."
        />
        <SettingsGovernanceHub overview={overview} />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <PageHeader title={NAV_LABELS.settings} subtitle="Informations de l'application." />
      <SettingsUserPreferences userId={data.user.id} />
    </div>
  );
}
