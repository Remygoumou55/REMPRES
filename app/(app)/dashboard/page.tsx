import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { getSuperAdminCockpitPayload } from "@/lib/server/super-admin-cockpit";
import { SuperAdminCockpitClient } from "@/components/dashboard/super-admin-cockpit/SuperAdminCockpitClient";
import { getLayoutAccess } from "@/lib/server/layout-access";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { resolvePostLoginRoute } from "@/lib/navigation/home-route";

export const metadata = {
  title: `${NAV_LABELS.home} — RemPres ERP`,
};

export default async function DashboardPage() {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }

  const [access, kpis] = await Promise.all([getLayoutAccess(), getDashboardKpis()]);

  if (!access.isSuperAdmin) {
    redirect(resolvePostLoginRoute(access.roleKey, access.departmentKey));
  }

  const superAdminCockpit = await getSuperAdminCockpitPayload(user.id, { kpis });

  if (superAdminCockpit) {
    return (
      <SuperAdminCockpitClient userDisplayName={access.userDisplayName} payload={superAdminCockpit} />
    );
  }

  redirect("/login");
}
