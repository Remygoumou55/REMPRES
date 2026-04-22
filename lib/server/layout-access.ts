import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getClientsPermissions, getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";

export async function getLayoutAccess() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const permissions = await getClientsPermissions(data.user.id);
  const productsPermissions = await getModulePermissions(data.user.id, ["produits", "vente"]);
  const canReadActivityLogs = await isSuperAdmin(data.user.id);

  return {
    email: data.user.email ?? null,
    canReadClients: permissions.canRead,
    canReadProducts: productsPermissions.canRead,
    canReadActivityLogs,
    isSuperAdmin: canReadActivityLogs, // même vérification
  };
}
