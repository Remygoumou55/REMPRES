/**
 * Authorization Matrix — règles déclaratives (Phase 5).
 * Voir ≠ modifier : chaque action déclare son niveau requis.
 */
import type { SystemAuthority } from "@/lib/auth/system-authority";
import { SYSTEM_AUTHORITY } from "@/lib/auth/system-authority";

export const MATRIX_RULES_VERSION = "authorization-matrix-v1" as const;

/** Actions gouvernées par le moteur central. */
export type MatrixAction =
  | "user.admin.update"
  | "user.role.update"
  | "user.deactivate"
  | "approval.decide"
  | "finance.expense.mutate"
  | "vente.operational.mutate"
  | "module.read"
  | "module.write"
  | "module.delete"
  | "settings.manage"
  | "governance.export";

export type MatrixActionRequirement =
  | "platform_root"
  | "admin_console"
  | "business_operational"
  | "module_permission";

export type MatrixActionRule = {
  action: MatrixAction;
  requirement: MatrixActionRequirement;
  /** Interdit aux acteurs control plane (mutations métier). */
  denyControlPlane?: boolean;
  /** Modules concernés quand requirement = module_permission. */
  moduleKey?: string;
  permission?: "read" | "create" | "update" | "delete";
};

export const MATRIX_ACTION_RULES: readonly MatrixActionRule[] = [
  { action: "user.admin.update", requirement: "platform_root" },
  { action: "user.role.update", requirement: "platform_root" },
  { action: "user.deactivate", requirement: "platform_root" },
  { action: "approval.decide", requirement: "admin_console" },
  { action: "settings.manage", requirement: "platform_root" },
  { action: "governance.export", requirement: "admin_console" },
  {
    action: "finance.expense.mutate",
    requirement: "business_operational",
    denyControlPlane: true,
  },
  {
    action: "vente.operational.mutate",
    requirement: "business_operational",
    denyControlPlane: true,
  },
  {
    action: "module.read",
    requirement: "module_permission",
    moduleKey: "*",
    permission: "read",
  },
  {
    action: "module.write",
    requirement: "module_permission",
    moduleKey: "*",
    permission: "create",
    denyControlPlane: true,
  },
  {
    action: "module.delete",
    requirement: "module_permission",
    moduleKey: "*",
    permission: "delete",
    denyControlPlane: true,
  },
] as const;

const RULE_BY_ACTION = new Map<MatrixAction, MatrixActionRule>(
  MATRIX_ACTION_RULES.map((r) => [r.action, r]),
);

export function getMatrixActionRule(action: MatrixAction): MatrixActionRule | null {
  return RULE_BY_ACTION.get(action) ?? null;
}

/** Préfixes routes control plane (gouvernance). */
export const MATRIX_CONTROL_PLANE_PREFIXES = [
  "/dashboard",
  "/actions",
  "/archives",
  "/settings",
  "/admin",
] as const;

/** Autorités système autorisées pour gouvernance plateforme. */
export const MATRIX_PLATFORM_ROOT_AUTHORITIES: ReadonlySet<SystemAuthority> = new Set([
  SYSTEM_AUTHORITY.ROOT,
  SYSTEM_AUTHORITY.SUPER_ADMIN,
]);
