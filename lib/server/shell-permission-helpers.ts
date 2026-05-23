/**
 * Helpers permissions shell — sans dépendance React cache (safe tests Vitest).
 */

export const SHELL_LAYOUT_MODULE_KEYS = [
  "clients",
  "vente",
  "produits",
  "finance",
  "rh",
  "logistics",
  "formation",
  "consultation",
  "marketing",
  "crm",
] as const;

export type PermissionRowSlice = {
  module_key?: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
};

export type ModulePermissionSlice = {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

function aggregateRows(rows: readonly PermissionRowSlice[]): ModulePermissionSlice {
  return {
    canRead: rows.some((p) => p.can_read),
    canCreate: rows.some((p) => p.can_create),
    canUpdate: rows.some((p) => p.can_update),
    canDelete: rows.some((p) => p.can_delete),
  };
}

export function aggregatePermissionsForModuleKeys(
  rows: readonly PermissionRowSlice[],
  moduleKeys: readonly string[],
): ModulePermissionSlice {
  const keySet = new Set(moduleKeys);
  return aggregateRows(rows.filter((r) => r.module_key && keySet.has(r.module_key)));
}
