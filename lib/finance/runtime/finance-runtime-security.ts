/**
 * B3 — Gouvernance sécurité runtime Finance (SEC-1 couche applicative, M2).
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
  FINANCE_DEPARTMENT_KEY,
  FINANCE_MODULE_KEY,
} from "@/modules/finance/constants/module-keys";

export class FinanceRuntimeSecurityError extends Error {
  constructor(
    message: string,
    readonly code: "finance:forbidden" | "finance:department_required" | "finance:write_not_enabled",
  ) {
    super(message);
    this.name = "FinanceRuntimeSecurityError";
  }
}

export type FinanceRuntimeAccessContext = {
  userId: string;
  departmentKey: string | null;
  financePermissions: ModulePermissions;
  supervision: boolean;
};

export async function resolveFinanceRuntimeReadAccess(
  userId: string,
): Promise<FinanceRuntimeAccessContext> {
  const [brief, financePermissions, superAdmin, adminConsole] = await Promise.all([
    getProfileAuthBrief(userId),
    getModulePermissions(userId, [FINANCE_MODULE_KEY]),
    isSuperAdmin(userId),
    isAdminRole(userId),
  ]);

  const supervision = superAdmin || adminConsole;

  if (!financePermissions.canRead && !supervision) {
    throw new FinanceRuntimeSecurityError(
      "Accès Finance refusé : permission lecture manquante.",
      "finance:forbidden",
    );
  }

  if (!supervision) {
    const dept = normalizeDepartmentKey(brief.departmentKey);
    if (dept !== DEPARTMENT_KEYS.FINANCE) {
      throw new FinanceRuntimeSecurityError(
        `Accès Finance opérationnel réservé au département ${FINANCE_DEPARTMENT_KEY}.`,
        "finance:department_required",
      );
    }
  }

  return {
    userId,
    departmentKey: brief.departmentKey,
    financePermissions,
    supervision,
  };
}

export async function assertFinanceRuntimeReadAccess(userId: string): Promise<FinanceRuntimeAccessContext> {
  return resolveFinanceRuntimeReadAccess(userId);
}

export async function assertFinanceRuntimeWriteAccess(
  userId: string,
  required: "create" | "update" | "delete",
): Promise<FinanceRuntimeAccessContext> {
  await assertOperationalMutationAllowed(userId);

  const ctx = await resolveFinanceRuntimeReadAccess(userId);

  if (ctx.supervision) {
    throw new FinanceRuntimeSecurityError(
      "Les mutations Finance opérationnelles sont interdites en mode supervision.",
      "finance:write_not_enabled",
    );
  }

  const dept = normalizeDepartmentKey(ctx.departmentKey);
  if (dept !== DEPARTMENT_KEYS.FINANCE) {
    throw new FinanceRuntimeSecurityError(
      `Mutation Finance réservée au département ${FINANCE_DEPARTMENT_KEY}.`,
      "finance:department_required",
    );
  }

  const allowed =
    required === "create"
      ? ctx.financePermissions.canCreate
      : required === "update"
        ? ctx.financePermissions.canUpdate
        : ctx.financePermissions.canDelete;

  if (!allowed) {
    throw new FinanceRuntimeSecurityError(
      `Permission Finance « ${required} » refusée.`,
      "finance:forbidden",
    );
  }

  return ctx;
}
