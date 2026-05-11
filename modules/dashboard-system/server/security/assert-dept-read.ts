import type { DepartmentKey } from "@/lib/constants/departments";
import {
  getModulePermissions,
  getProfileAuthBrief,
  isAdminRole,
  isSuperAdmin,
} from "@/lib/server/permissions";

/**
 * Aligné sur `GET /api/dept/[deptKey]/kpis` — pour actions serveur / orchestrations futures
 * sans exposer de route parallèle.
 */
export async function assertDashboardDeptRead(userId: string, deptKey: DepartmentKey): Promise<void> {
  const [superAdmin, adminRole, profileBrief, deptPermission] = await Promise.all([
    isSuperAdmin(userId),
    isAdminRole(userId),
    getProfileAuthBrief(userId),
    getModulePermissions(userId, [deptKey]),
  ]);

  const legacyDG = String(profileBrief.roleKey ?? "").trim().toLowerCase() === "directeur_general";
  if (!superAdmin && !adminRole && !legacyDG && !deptPermission.canRead) {
    throw new Error("Accès refusé au tableau de bord département.");
  }
}
