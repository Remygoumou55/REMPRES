/**
 * Fondation Authorization Matrix Engine (Phase 5) — types et scopes uniquement.
 */
import type { DepartmentKey } from "@/lib/departments/department-config";
import type { SystemAuthority } from "@/lib/auth/system-authority";

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

/** Contrat moteur futur — résolution centralisée (implémentation Phase 5). */
export type AuthorizationMatrixEngine = {
  resolveScope(userId: string): Promise<MatrixAuthorityScope>;
  canAccessRoute(userId: string, pathname: string): Promise<boolean>;
  canExecuteAction(userId: string, action: string): Promise<boolean>;
};
