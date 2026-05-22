/**
 * B2.0 — Cycle de vie ventes (runtime officiel, aligné B1.4 / B1.5 / SQL 034).
 * Source unique pour filtres requêtes et garde-fous mutation.
 */

export const SALES_LIFECYCLE_STATUS = {
  VALIDATED: "validated",
  CANCELLED: "cancelled",
  ARCHIVED: "archived",
} as const;

export type SalesLifecycleStatus =
  (typeof SALES_LIFECYCLE_STATUS)[keyof typeof SALES_LIFECYCLE_STATUS];

/** Ventes visibles dans les vues opérationnelles (POS, listes actives, KPI commerce). */
export const SALES_OPERATIONAL_LIFECYCLE: SalesLifecycleStatus = SALES_LIFECYCLE_STATUS.VALIDATED;

/** Colonne obsolète — ne plus filtrer les KPI / agrégats sur deleted_at (B1.4). */
export const SALES_LEGACY_DELETED_AT_DEPRECATED = true as const;

export function isOperationalSalesLifecycle(
  status: string | null | undefined,
): boolean {
  return status === SALES_OPERATIONAL_LIFECYCLE;
}

export function isMutableSalesLifecycle(status: string | null | undefined): boolean {
  return isOperationalSalesLifecycle(status);
}

export function isArchivedSalesLifecycle(status: string | null | undefined): boolean {
  return status === SALES_LIFECYCLE_STATUS.ARCHIVED;
}

export function isCancelledSalesLifecycle(status: string | null | undefined): boolean {
  return status === SALES_LIFECYCLE_STATUS.CANCELLED;
}
