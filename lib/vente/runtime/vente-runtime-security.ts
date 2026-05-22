/**
 * B2.0 — Gouvernance sécurité runtime Vente / CRM (SEC-1 couche applicative, M2).
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
import { CRM_DEPARTMENT_KEY, CRM_MODULE_KEY } from "@/modules/crm/constants/module-keys";

export class VenteRuntimeSecurityError extends Error {
  constructor(
    message: string,
    readonly code:
      | "crm:forbidden"
      | "crm:department_required"
      | "crm:write_not_enabled"
      | "vente:forbidden",
  ) {
    super(message);
    this.name = "VenteRuntimeSecurityError";
  }
}

export type CrmRuntimeAccessContext = {
  userId: string;
  departmentKey: string | null;
  crmPermissions: ModulePermissions;
  supervision: boolean;
};

/**
 * SEC-1 (lecture) : permission module `crm`/`vente` + département VENTE pour accès opérationnel.
 * Supervision (super_admin / console admin) : lecture autorisée sans dept VENTE.
 */
export async function resolveCrmRuntimeReadAccess(
  userId: string,
): Promise<CrmRuntimeAccessContext> {
  const [brief, crmPermissions, superAdmin, adminConsole] = await Promise.all([
    getProfileAuthBrief(userId),
    getModulePermissions(userId, [CRM_MODULE_KEY, "vente"]),
    isSuperAdmin(userId),
    isAdminRole(userId),
  ]);

  const supervision = superAdmin || adminConsole;

  if (!crmPermissions.canRead && !supervision) {
    throw new VenteRuntimeSecurityError(
      "Accès CRM refusé : permission lecture manquante.",
      "crm:forbidden",
    );
  }

  if (!supervision) {
    const dept = normalizeDepartmentKey(brief.departmentKey);
    if (dept !== DEPARTMENT_KEYS.VENTE) {
      throw new VenteRuntimeSecurityError(
        `Accès CRM opérationnel réservé au département ${CRM_DEPARTMENT_KEY}.`,
        "crm:department_required",
      );
    }
  }

  return {
    userId,
    departmentKey: brief.departmentKey,
    crmPermissions,
    supervision,
  };
}

export async function assertCrmRuntimeReadAccess(userId: string): Promise<CrmRuntimeAccessContext> {
  return resolveCrmRuntimeReadAccess(userId);
}

/**
 * SEC-1 (écriture) : mutations CRM futures — dept VENTE obligatoire, pas de supervision opérationnelle.
 */
export async function assertCrmRuntimeWriteAccess(
  userId: string,
  required: "create" | "update" | "delete",
): Promise<CrmRuntimeAccessContext> {
  await assertOperationalMutationAllowed(userId);

  const ctx = await resolveCrmRuntimeReadAccess(userId);

  if (ctx.supervision) {
    throw new VenteRuntimeSecurityError(
      "Les mutations CRM opérationnelles sont interdites en mode supervision.",
      "crm:write_not_enabled",
    );
  }

  const dept = normalizeDepartmentKey(ctx.departmentKey);
  if (dept !== DEPARTMENT_KEYS.VENTE) {
    throw new VenteRuntimeSecurityError(
      `Mutation CRM réservée au département ${CRM_DEPARTMENT_KEY}.`,
      "crm:department_required",
    );
  }

  const allowed =
    required === "create"
      ? ctx.crmPermissions.canCreate
      : required === "update"
        ? ctx.crmPermissions.canUpdate
        : ctx.crmPermissions.canDelete;

  if (!allowed) {
    throw new VenteRuntimeSecurityError(
      `Permission CRM « ${required} » refusée.`,
      "crm:forbidden",
    );
  }

  return ctx;
}
