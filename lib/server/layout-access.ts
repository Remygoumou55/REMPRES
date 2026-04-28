import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getClientsPermissions, getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";
import {
  avatarInitialFromDisplayName,
  getCachedProfileDisplayName,
} from "@/lib/server/profile-display";

export async function getLayoutAccess() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const userId = data.user.id;

  const [
    permissions,
    productsPermissions,
    financePermissions,
    canReadActivityLogs,
    userDisplayName,
  ] = await Promise.all([
    getClientsPermissions(userId),
    getModulePermissions(userId, ["produits", "vente"]),
    getModulePermissions(userId, ["finance"]),
    isSuperAdmin(userId),
    getCachedProfileDisplayName(userId),
  ]);

  return {
    userDisplayName,
    userAvatarInitial: avatarInitialFromDisplayName(userDisplayName),
    canReadClients: permissions.canRead,
    canReadProducts: productsPermissions.canRead,
    canReadFinance: financePermissions.canRead,
    canReadActivityLogs,
    isSuperAdmin: canReadActivityLogs, // même vérification
  };
}
