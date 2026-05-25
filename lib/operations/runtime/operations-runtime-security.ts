/**
 * Bloc 3 — Sécurité runtime Operations / Project.
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
  OPERATIONS_DEPARTMENT_KEY,
  OPERATIONS_MODULE_KEY,
} from "@/modules/operations/constants/module-keys";

export class OperationsRuntimeSecurityError extends Error {
  constructor(
    message: string,
    readonly code: "ops:forbidden" | "ops:department_required",
  ) {
    super(message);
    this.name = "OperationsRuntimeSecurityError";
  }
}

export type OperationsRuntimeAccessContext = {
  userId: string;
  departmentKey: string | null;
  operationsPermissions: ModulePermissions;
  supervision: boolean;
};

const OPS_DEPT_KEYS = new Set<string>([
  DEPARTMENT_KEYS.CONSULTATION,
  DEPARTMENT_KEYS.ADMINISTRATION,
]);

export async function resolveOperationsRuntimeReadAccess(
  userId: string,
): Promise<OperationsRuntimeAccessContext> {
  const [brief, operationsPermissions, superAdmin, adminConsole] = await Promise.all([
    getProfileAuthBrief(userId),
    getModulePermissions(userId, [OPERATIONS_MODULE_KEY]),
    isSuperAdmin(userId),
    isAdminRole(userId),
  ]);

  const supervision = superAdmin || adminConsole;

  if (!operationsPermissions.canRead && !supervision) {
    throw new OperationsRuntimeSecurityError(
      "Accès operations refusé : permission lecture manquante.",
      "ops:forbidden",
    );
  }

  if (!supervision) {
    const dept = normalizeDepartmentKey(brief.departmentKey);
    if (!dept || !OPS_DEPT_KEYS.has(dept)) {
      throw new OperationsRuntimeSecurityError(
        `Accès operations réservé aux départements ${OPERATIONS_DEPARTMENT_KEY} / ADMINISTRATION.`,
        "ops:department_required",
      );
    }
  }

  return { userId, departmentKey: brief.departmentKey, operationsPermissions, supervision };
}

export async function assertOperationsRuntimeReadAccess(
  userId: string,
): Promise<OperationsRuntimeAccessContext> {
  return resolveOperationsRuntimeReadAccess(userId);
}

export async function assertOperationsRuntimeWriteAccess(
  userId: string,
  permission: "create" | "update" | "delete" = "update",
): Promise<OperationsRuntimeAccessContext> {
  const ctx = await resolveOperationsRuntimeReadAccess(userId);
  await assertOperationalMutationAllowed(userId);

  if (ctx.supervision) return ctx;

  const allowed =
    permission === "create"
      ? ctx.operationsPermissions.canCreate
      : permission === "delete"
        ? ctx.operationsPermissions.canDelete
        : ctx.operationsPermissions.canUpdate;

  if (!allowed) {
    throw new OperationsRuntimeSecurityError(
      "Écriture operations refusée : permission insuffisante.",
      "ops:forbidden",
    );
  }

  return ctx;
}
