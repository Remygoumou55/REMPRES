import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { PermissionsGovernancePanel } from "@/components/settings/PermissionsGovernancePanel";

export const metadata = { title: "Permissions — Paramètres" };

export default async function SettingsPermissionsPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  if (!(await isAdminRole(data.user.id))) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Permissions"
        subtitle="Rôles gouvernés ERP — un département principal et un rôle générique par utilisateur."
      />
      <PermissionsGovernancePanel />
    </div>
  );
}
