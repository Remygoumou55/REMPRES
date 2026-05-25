"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidateLogistique } from "@/lib/cache/revalidation-map";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import {
  adjustLogisticsStock,
  approveLogisticsPurchaseOrder,
  createLogisticsGoodsReceipt,
  createLogisticsPurchaseOrder,
  createLogisticsSupplier,
  submitLogisticsPurchaseOrder,
  transferLogisticsStock,
  updateLogisticsSupplierActive,
} from "@/modules/logistics/server/services/logistics-mutations";

function mapSupplyError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message.startsWith("supply:")) return "Action supply refusée par la gouvernance.";
    return e.message;
  }
  return "Erreur supply inattendue.";
}

async function requireUserId(): Promise<string | SafeResult<never>> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect("/login");
  return data.user.id;
}

function afterSupplyMutation() {
  void revalidateLogistique();
}

export async function createLogisticsSupplierAction(input: {
  companyName: string;
  contactEmail?: string;
  phone?: string;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createLogisticsSupplier(userId, input);
    afterSupplyMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapSupplyError(e));
  }
}

export async function createLogisticsPurchaseOrderAction(input: {
  supplierId: string;
  warehouseId?: string;
  productId: string;
  qtyOrdered: number;
  unitCostGnf?: number;
  notes?: string;
}): Promise<SafeResult<{ id: string; poNumber: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createLogisticsPurchaseOrder(userId, input);
    afterSupplyMutation();
    return ok({ id: row.id, poNumber: row.po_number });
  } catch (e) {
    return err(mapSupplyError(e));
  }
}

export async function submitLogisticsPurchaseOrderAction(
  purchaseOrderId: string,
  reason?: string,
): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await submitLogisticsPurchaseOrder(userId, purchaseOrderId, reason);
    afterSupplyMutation();
    return ok(null);
  } catch (e) {
    return err(mapSupplyError(e));
  }
}

export async function approveLogisticsPurchaseOrderAction(
  purchaseOrderId: string,
): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await approveLogisticsPurchaseOrder(userId, purchaseOrderId);
    afterSupplyMutation();
    return ok(null);
  } catch (e) {
    return err(mapSupplyError(e));
  }
}

export async function createLogisticsGoodsReceiptAction(input: {
  productId: string;
  qtyReceived: number;
  purchaseOrderId?: string;
  warehouseId?: string;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createLogisticsGoodsReceipt(userId, input);
    afterSupplyMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapSupplyError(e));
  }
}

export async function adjustLogisticsStockAction(input: {
  productId: string;
  qtyDelta: number;
  warehouseId?: string;
  reason?: string;
}): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await adjustLogisticsStock(userId, input);
    afterSupplyMutation();
    return ok(null);
  } catch (e) {
    return err(mapSupplyError(e));
  }
}

export async function transferLogisticsStockAction(input: {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  qty: number;
}): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await transferLogisticsStock(userId, input);
    afterSupplyMutation();
    return ok(null);
  } catch (e) {
    return err(mapSupplyError(e));
  }
}

export async function suspendLogisticsSupplierAction(
  supplierId: string,
): Promise<SafeResult<null>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    await updateLogisticsSupplierActive(userId, supplierId, false);
    afterSupplyMutation();
    return ok(null);
  } catch (e) {
    return err(mapSupplyError(e));
  }
}
