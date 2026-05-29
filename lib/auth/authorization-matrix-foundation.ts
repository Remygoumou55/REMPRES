/**
 * Fondation Authorization Matrix Engine (Phase 5).
 */
import type { DepartmentKey } from "@/lib/departments/department-config";
import type { SystemAuthority } from "@/lib/auth/system-authority";
import type { MatrixAction } from "@/lib/auth/authorization-matrix-rules";

export const AUTHORIZATION_MATRIX_FOUNDATION_VERSION = "matrix-foundation-v1" as const;

export type AuthorityScopeLevel =
  | "system"
  | "department"
  | "role"
  | "permission"
  | "route"
  | "action";

export type MatrixAuthorityScope = {
  systemAuthority: SystemAuthority;
  departmentKey: DepartmentKey | null;
  roleKey: string;
  moduleKeys: readonly string[];
  routePrefixes: readonly string[];
  actions: readonly string[];
};

/** Contrat moteur async — implémenté par createAuthorizationMatrixEngine. */
export type AuthorizationMatrixEngine = {
  resolveScope(userId: string): Promise<MatrixAuthorityScope>;
  canAccessRoute(userId: string, pathname: string): Promise<boolean>;
  canExecuteAction(userId: string, action: MatrixAction): Promise<boolean>;
};

export type { MatrixAction };
