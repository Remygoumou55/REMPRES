import { isSuperAdminRoleKey } from "@/lib/auth/roles";
import { getProfileAuthBrief, isAdminRole, isSuperAdmin } from "@/lib/server/permissions";

/**
 * Centre exécutif : même périmètre transverse que la lecture multi-domaines sensible
 * (super admin, rôle admin applicatif, directeur général legacy).
 */
export async function assertExecutiveDashboardRead(userId: string): Promise<void> {
  const [superAdmin, adminRole, profileBrief] = await Promise.all([
    isSuperAdmin(userId),
    isAdminRole(userId),
    getProfileAuthBrief(userId),
  ]);
  const legacyDG = String(profileBrief.roleKey ?? "").trim().toLowerCase() === "directeur_general";
  if (!superAdmin && !adminRole && !legacyDG && !isSuperAdminRoleKey(profileBrief.roleKey)) {
    throw new Error("Accès réservé au centre de commandement exécutif.");
  }
}
