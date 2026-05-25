/**
 * Bloc 3 — Sécurité runtime Supply / Logistique.
 */

import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { assertOperationalMutationAllowed } from "@/lib/server/auth-operational-guards";
import {
  getModulePermissions,
  getProfileAuthBrief,
  isAdminRole,
  isSuperAdmin,
  type ModulePermissions,
} from "@/lib/server/permissions";
import {
  LOGISTICS_DEPARTMENT_KEY,
  LOGISTICS_MODULE_KEY,
} from "@/modules/logistics/constants/module-keys";

export class LogisticsRuntimeSecurityError extends Error {
  constructor(
    message: string,
    readonly code: "supply:forbidden" | "supply:department_required",
  ) {
    super(message);
    this.name = "LogisticsRuntimeSecurityError";
  }
}

export type LogisticsRuntimeAccessContext = {
  userId: string;
  departmentKey: string | null;
  logisticsPermissions: ModulePermissions;
  supervision: boolean;
};

export async function resolveLogisticsRuntimeReadAccess(
  userId: string,
): Promise<LogisticsRuntimeAccessContext> {
  const [brief, logisticsPermissions, superAdmin, adminConsole] = await Promise.all([
    getProfileAuthBrief(userId),
    getModulePermissions(userId, [LOGISTICS_MODULE_KEY]),
    isSuperAdmin(userId),
    isAdminRole(userId),
  ]);

  const supervision = superAdmin || adminConsole;

  if (!logisticsPermissions.canRead && !supervision) {
    throw new LogisticsRuntimeSecurityError(
      "Accès logistique refusé : permission lecture manquante.",
      "supply:forbidden",
    );
  }

  if (!supervision) {
    const dept = normalizeDepartmentKey(brief.departmentKey);
    if (dept !== DEPARTMENT_KEYS.LOGISTIQUE) {
      throw new LogisticsRuntimeSecurityError(
        `Accès supply opérationnel réservé au département ${LOGISTICS_DEPARTMENT_KEY}.`,
        "supply:department_required",
      );
    }
  }

  return { userId, departmentKey: brief.departmentKey, logisticsPermissions, supervision };
}

export async function assertLogisticsRuntimeReadAccess(
  userId: string,
): Promise<LogisticsRuntimeAccessContext> {
  return resolveLogisticsRuntimeReadAccess(userId);
}

export async function assertLogisticsRuntimeWriteAccess(
  userId: string,
  permission: "create" | "update" | "delete" = "update",
): Promise<LogisticsRuntimeAccessContext> {
  const ctx = await resolveLogisticsRuntimeReadAccess(userId);
  await assertOperationalMutationAllowed(userId);

  if (ctx.supervision) return ctx;

  const allowed =
    permission === "create"
      ? ctx.logisticsPermissions.canCreate
      : permission === "delete"
        ? ctx.logisticsPermissions.canDelete
        : ctx.logisticsPermissions.canUpdate;

  if (!allowed) {
    throw new LogisticsRuntimeSecurityError(
      "Écriture supply refusée : permission insuffisante.",
      "supply:forbidden",
    );
  }

  return ctx;
}
