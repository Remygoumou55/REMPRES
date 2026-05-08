import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { DeptSupervisionClient } from "./DeptSupervisionClient";

export default async function DeptPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [admin, superAdmin] = await Promise.all([isAdminRole(data.user.id), isSuperAdmin(data.user.id)]);
  if (!admin && !superAdmin) redirect("/access-denied");

  return (
    <div className="page-wrapper">
      <PageHeader
        title={NAV_LABELS.dept}
        subtitle="Vue de supervision opérationnelle en temps réel"
      />
      <DeptSupervisionClient />
    </div>
  );
}

