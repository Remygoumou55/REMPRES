import {
  revalidateAdminApprovals,
  revalidateDashboardFoundation,
  revalidateModules,
} from "@/lib/cache/revalidation-map";

/** Modules Next.js à revalider après exécution d'une approbation (aligné sur `executeAction`). */
const ACTION_MODULE_KEYS: Record<string, readonly string[]> = {
  delete_sale: ["vente", "clients", "produits", "finance", "activity_logs"],
  delete_client: ["clients", "vente", "activity_logs"],
  delete_product: ["produits", "vente", "activity_logs"],
  large_expense: ["finance", "activity_logs"],
  delete_employee: ["rh", "activity_logs"],
  cancel_formation: ["formation", "activity_logs"],
  delete_mission: ["consultation", "formation", "activity_logs"],
  delete_stock_item: ["logistique", "activity_logs"],
  approve_purchase_order: ["logistique", "activity_logs"],
};

/**
 * Revalidation serveur factorisée — appelée après exécution d'une action approuvée
 * pour que listes, KPIs et dashboards se mettent à jour sans F5.
 */
export async function revalidateAfterApprovalExecution(
  actionType: string,
  departmentKey?: string | null,
): Promise<void> {
  const modules = ACTION_MODULE_KEYS[actionType] ?? ["dashboard_foundation"];
  await revalidateModules(...modules);
  await revalidateAdminApprovals();

  const dept = String(departmentKey ?? "")
    .trim()
    .toLowerCase();
  if (dept && dept !== "unknown") {
    await revalidateDashboardFoundation([dept]);
  }
}
