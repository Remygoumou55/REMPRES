import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";

/** Aligné sur la page hub Admin : accès réservé aux rôles administration applicative. */
export async function assertAdminPlatformDashboardRead(userId: string): Promise<void> {
  const [admin, superAdmin] = await Promise.all([isAdminRole(userId), isSuperAdmin(userId)]);
  if (!admin && !superAdmin) {
    throw new Error("Accès réservé au centre de pilotage plateforme.");
  }
}
