import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import { getAdminPlatformOverviewModel } from "@/modules/admin-platform-dashboard/server";
import { PlatformCommandCenter } from "@/modules/admin-platform-dashboard/components/PlatformCommandCenter";

export const metadata = {
  title: "Plateforme — Centre de pilotage",
};

export default async function AdminPlatformDashboardPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [admin, superAdmin] = await Promise.all([isAdminRole(data.user.id), isSuperAdmin(data.user.id)]);
  if (!admin && !superAdmin) redirect("/access-denied");

  const model = await getAdminPlatformOverviewModel({
    viewerUserId: data.user.id,
    elevated: admin || superAdmin,
  });
  return <PlatformCommandCenter model={model} />;
}
