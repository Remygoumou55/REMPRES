/**
 * Invalidation React Query ciblée quand une demande d'approbation change
 * (aligné sur `approval-revalidation.ts` côté serveur).
 */
const ACTION_MODULE_KEYS: Record<string, readonly string[]> = {
  delete_sale: ["vente", "clients", "produits", "finance", "admin_approvals"],
  delete_client: ["clients", "vente", "admin_approvals"],
  delete_product: ["produits", "vente", "admin_approvals"],
  large_expense: ["finance", "admin_approvals"],
  delete_employee: ["rh", "admin_approvals"],
  cancel_formation: ["formation", "admin_approvals"],
  delete_mission: ["consultation", "formation", "admin_approvals"],
  delete_stock_item: ["logistique", "admin_approvals"],
  approve_purchase_order: ["logistique", "admin_approvals"],
};

export function modulesForApprovalAction(actionType: string | null | undefined): string[] {
  const key = String(actionType ?? "").trim();
  const modules = ACTION_MODULE_KEYS[key];
  if (modules) return [...modules, "dashboard_foundation", "activity_logs"];
  return ["admin_approvals", "dashboard_foundation"];
}

export function actionTypeFromApprovalRow(
  row: Record<string, unknown> | null | undefined,
): string | null {
  if (!row) return null;
  const direct = row.action_type;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const payload =
    row.payload_snapshot && typeof row.payload_snapshot === "object"
      ? (row.payload_snapshot as Record<string, unknown>)
      : row.action_payload && typeof row.action_payload === "object"
        ? (row.action_payload as Record<string, unknown>)
        : null;
  const fromPayload = payload?.operation ?? payload?.action_type;
  return typeof fromPayload === "string" ? fromPayload.trim() : null;
}
