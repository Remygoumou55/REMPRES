import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { DashboardClient } from "./DashboardClient";
import { getClientsPermissions, getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";

export default async function DashboardPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const [permissions, productsPermissions, canReadActivityLogs, kpis] = await Promise.all([
    getClientsPermissions(data.user.id),
    getModulePermissions(data.user.id, ["produits", "vente"]),
    isSuperAdmin(data.user.id),
    getDashboardKpis(),
  ]);

  const superAdmin = await isSuperAdmin(data.user.id);

  return (
    <DashboardClient
      email={data.user.email ?? null}
      canReadClients={permissions.canRead}
      canReadProducts={productsPermissions.canRead}
      canReadActivityLogs={canReadActivityLogs}
      isSuperAdmin={superAdmin}
      kpis={kpis}
    />
  );
}
