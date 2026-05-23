/**
 * B3.1 — Sécurité approval (M2 role_key + department_key, B2.4).
 */

import { DEPARTMENT_KEYS, normalizeDepartmentKey } from "@/lib/departments/department-config";
import { effectiveAuthRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import { getProfileAuthBrief, isAdminRole, isSuperAdmin } from "@/lib/server/permissions";
import type { ErpApprovalActor } from "@/lib/erp-core/approval/domain-model";

export class ErpApprovalSecurityError extends Error {
  constructor(
    message: string,
    readonly code:
      | "approval:forbidden"
      | "approval:department_required"
      | "approval:not_approver",
  ) {
    super(message);
    this.name = "ErpApprovalSecurityError";
  }
}

export async function resolveApprovalActor(userId: string): Promise<ErpApprovalActor> {
  const [brief, superAdmin, adminConsole] = await Promise.all([
    getProfileAuthBrief(userId),
    isSuperAdmin(userId),
    isAdminRole(userId),
  ]);

  return {
    userId,
    roleKey: superAdmin
      ? ROLE_KEYS.SUPER_ADMIN
      : adminConsole
        ? "admin"
        : brief.roleKey,
    departmentKey: brief.departmentKey,
  };
}

export async function assertCanSubmitApprovalRequest(
  actorUserId: string,
  departmentKey: string,
): Promise<ErpApprovalActor> {
  const actor = await resolveApprovalActor(actorUserId);
  const superAdmin = actor.roleKey === ROLE_KEYS.SUPER_ADMIN;

  if (superAdmin) {
    throw new ErpApprovalSecurityError(
      "Le super administrateur ne soumet pas de demandes d'approbation opérationnelles.",
      "approval:forbidden",
    );
  }

  const dept = normalizeDepartmentKey(actor.departmentKey);
  const expected = normalizeDepartmentKey(departmentKey);
  if (dept !== expected) {
    throw new ErpApprovalSecurityError(
      `Soumission réservée au département ${departmentKey}.`,
      "approval:department_required",
    );
  }

  return actor;
}

/**
 * Approbateurs effectifs aujourd'hui : super_admin (RLS 036).
 * Rôles manager déclarés en policy = dette jusqu'à migration RLS dept managers.
 */
export async function assertCanDecideApprovalRequest(approverUserId: string): Promise<ErpApprovalActor> {
  const actor = await resolveApprovalActor(approverUserId);
  const role = effectiveAuthRoleKey(actor.roleKey);

  if (role !== ROLE_KEYS.SUPER_ADMIN) {
    throw new ErpApprovalSecurityError(
      "Décision d'approbation réservée au super administrateur (RLS actuelle).",
      "approval:not_approver",
    );
  }

  return actor;
}

export function departmentKeyForMutation(dept: string | null | undefined): string {
  const normalized = normalizeDepartmentKey(dept);
  if (normalized === DEPARTMENT_KEYS.VENTE) return "VENTE";
  if (normalized === DEPARTMENT_KEYS.FINANCE) return "FINANCE";
  if (normalized === DEPARTMENT_KEYS.RH) return "RH";
  return String(dept ?? "UNKNOWN").trim().toUpperCase() || "UNKNOWN";
}
