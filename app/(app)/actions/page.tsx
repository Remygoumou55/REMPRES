import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { getActionsGovernanceOverview } from "@/lib/server/actions-governance-overview";
import { PageHeader } from "@/components/ui/page-header";
import { ActionsGovernanceHub } from "@/components/actions/ActionsGovernanceHub";
import { NAV_LABELS } from "@/lib/constants/nav-labels";

export const metadata = {
  title: `${NAV_LABELS.actionsOverview} — ${NAV_LABELS.actions} — RemPres ERP`,
};

export default async function ActionsPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [admin, superAdmin] = await Promise.all([isAdminRole(data.user.id), isSuperAdmin(data.user.id)]);
  if (!admin && !superAdmin) redirect("/access-denied");

  const overview = await getActionsGovernanceOverview();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Actions — gouvernance ERP"
        subtitle="Validations, alertes, audit, journaux applicatifs et activité système — centre de supervision unique."
      />
      <ActionsGovernanceHub overview={overview} />
    </div>
  );
}
