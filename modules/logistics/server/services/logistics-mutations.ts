/**
 * Bloc 3 — Mutations Supply / Logistique gouvernées.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  assertLogisticsWriteActionAllowed,
  LOGISTICS_WRITE_ACTIONS,
} from "@/lib/logistics/runtime/logistics-write-governance";
import {
  emitSupplyInventoryMoved,
  emitSupplyInventoryReceived,
  emitSupplyPoCreated,
  emitSupplyPurchaseApproved,
  emitSupplyPurchaseRequested,
  emitSupplyStockAdjusted,
  emitSupplySupplierCreated,
} from "@/lib/erp-core/events/integrations/supply-events";
import { LOGISTICS_APPROVAL_ENTITY_TYPES } from "@/modules/logistics/constants/approval-entities";
import { recordLogisticsGovernanceAudit } from "@/modules/logistics/server/services/logistics-audit-hook";

type Db = SupabaseClient<Database>;

function refCode(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

async function getDefaultWarehouseId(supabase: Db): Promise<string> {
  const { data, error } = await supabase
    .from("logistics_warehouses")
    .select("id")
    .eq("is_active", true)
    .eq("is_default", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data?.id) return data.id;

  const { data: fallback, error: fbErr } = await supabase
    .from("logistics_warehouses")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (fbErr || !fallback?.id) throw new Error("Aucun entrepôt actif.");
  return fallback.id;
}

export type CreateLogisticsSupplierInput = {
  companyName: string;
  contactEmail?: string | null;
  phone?: string | null;
};

export async function createLogisticsSupplier(userId: string, input: CreateLogisticsSupplierInput) {
  await assertLogisticsWriteActionAllowed(userId, LOGISTICS_WRITE_ACTIONS.SUPPLIER_CREATE, "create");

  const companyName = input.companyName.trim();
  if (!companyName) throw new Error("La raison sociale est obligatoire.");

  const supabase = getSupabaseServerClient();
  const supplierCode = refCode("SUP");

  const { data, error } = await supabase
    .from("logistics_suppliers")
    .insert({
      supplier_code: supplierCode,
      company_name: companyName,
      contact_email: input.contactEmail?.trim() || null,
      phone: input.phone?.trim() || null,
      is_active: true,
    })
    .select("id,supplier_code,company_name,is_active")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitSupplySupplierCreated({
      actorUserId: userId,
      supplierId: data.id,
      supplierCode: data.supplier_code,
      companyName: data.company_name,
    }),
    recordLogisticsGovernanceAudit({
      actionType: LOGISTICS_WRITE_ACTIONS.SUPPLIER_CREATE,
      entityType: "logistics_suppliers",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function updateLogisticsSupplierActive(
  userId: string,
  supplierId: string,
  isActive: boolean,
) {
  await assertLogisticsWriteActionAllowed(userId, LOGISTICS_WRITE_ACTIONS.SUPPLIER_UPDATE, "update");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("logistics_suppliers")
    .update({ is_active: isActive })
    .eq("id", supplierId)
    .select("id,supplier_code,is_active")
    .single();

  if (error) throw new Error(error.message);

  await recordLogisticsGovernanceAudit({
    actionType: LOGISTICS_WRITE_ACTIONS.SUPPLIER_UPDATE,
    entityType: "logistics_suppliers",
    entityId: supplierId,
    afterSnapshot: data,
  });

  return data;
}

export type CreateLogisticsPurchaseOrderInput = {
  supplierId: string;
  warehouseId?: string | null;
  productId: string;
  qtyOrdered: number;
  unitCostGnf?: number;
  notes?: string | null;
};

export async function createLogisticsPurchaseOrder(
  userId: string,
  input: CreateLogisticsPurchaseOrderInput,
) {
  await assertLogisticsWriteActionAllowed(userId, LOGISTICS_WRITE_ACTIONS.PO_CREATE, "create");

  const qty = Math.max(1, Math.floor(Number(input.qtyOrdered)));
  const unitCost = Math.max(0, Number(input.unitCostGnf ?? 0));
  const total = Math.round(qty * unitCost * 100) / 100;

  const supabase = getSupabaseServerClient();
  const warehouseId = input.warehouseId ?? (await getDefaultWarehouseId(supabase));
  const poNumber = refCode("PO");

  const { data: po, error: poErr } = await supabase
    .from("logistics_purchase_orders")
    .insert({
      po_number: poNumber,
      supplier_id: input.supplierId,
      warehouse_id: warehouseId,
      status: "draft",
      total_estimated_gnf: total,
      notes: input.notes?.trim() || null,
      created_by: userId,
    })
    .select("id,po_number,supplier_id,status,total_estimated_gnf")
    .single();

  if (poErr) throw new Error(poErr.message);

  const { error: lineErr } = await supabase.from("logistics_purchase_order_lines").insert({
    purchase_order_id: po.id,
    line_order: 0,
    product_id: input.productId,
    qty_ordered: qty,
    unit_cost_gnf: unitCost,
  });

  if (lineErr) throw new Error(lineErr.message);

  await Promise.all([
    emitSupplyPoCreated({
      actorUserId: userId,
      purchaseOrderId: po.id,
      poNumber: po.po_number,
      supplierId: po.supplier_id,
      totalEstimatedGnf: Number(po.total_estimated_gnf),
    }),
    recordLogisticsGovernanceAudit({
      actionType: LOGISTICS_WRITE_ACTIONS.PO_CREATE,
      entityType: "logistics_purchase_orders",
      entityId: po.id,
      afterSnapshot: po,
    }),
  ]);

  return po;
}

export async function submitLogisticsPurchaseOrder(
  userId: string,
  purchaseOrderId: string,
  reason?: string,
) {
  const supabase = getSupabaseServerClient();
  const { data: po } = await supabase
    .from("logistics_purchase_orders")
    .select("id,po_number,status,total_estimated_gnf")
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!po || po.status !== "draft") {
    throw new Error("Seules les commandes brouillon peuvent être soumises.");
  }

  await assertLogisticsWriteActionAllowed(userId, LOGISTICS_WRITE_ACTIONS.PO_SUBMIT, "update");

  await supabase.from("approval_requests").insert({
    department_key: "logistics",
    action_type: LOGISTICS_WRITE_ACTIONS.PO_SUBMIT,
    entity_type: LOGISTICS_APPROVAL_ENTITY_TYPES.purchaseOrder,
    entity_id: purchaseOrderId,
    requested_by: userId,
    reason: reason ?? "Soumission commande achat",
    payload_snapshot: { po_number: po.po_number, amount_gnf: po.total_estimated_gnf },
  });

  const { data, error } = await supabase
    .from("logistics_purchase_orders")
    .update({ status: "submitted" })
    .eq("id", purchaseOrderId)
    .select("id,po_number,status")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitSupplyPurchaseRequested({
      actorUserId: userId,
      purchaseOrderId,
      poNumber: data.po_number,
      amountGnf: Number(po.total_estimated_gnf),
    }),
    recordLogisticsGovernanceAudit({
      actionType: LOGISTICS_WRITE_ACTIONS.PO_SUBMIT,
      entityType: "logistics_purchase_orders",
      entityId: purchaseOrderId,
      beforeSnapshot: { status: po.status },
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function approveLogisticsPurchaseOrder(userId: string, purchaseOrderId: string) {
  await assertLogisticsWriteActionAllowed(userId, LOGISTICS_WRITE_ACTIONS.PO_APPROVE, "update");

  const supabase = getSupabaseServerClient();
  const { data: po } = await supabase
    .from("logistics_purchase_orders")
    .select("id,po_number,status")
    .eq("id", purchaseOrderId)
    .maybeSingle();

  if (!po) throw new Error("Commande introuvable.");
  if (po.status === "approved") return po;
  if (po.status !== "submitted") {
    throw new Error("Seules les commandes soumises peuvent être approuvées.");
  }

  const { data, error } = await supabase
    .from("logistics_purchase_orders")
    .update({ status: "approved" })
    .eq("id", purchaseOrderId)
    .select("id,po_number,status")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitSupplyPurchaseApproved({
      actorUserId: userId,
      purchaseOrderId,
      poNumber: data.po_number,
    }),
    recordLogisticsGovernanceAudit({
      actionType: LOGISTICS_WRITE_ACTIONS.PO_APPROVE,
      entityType: "logistics_purchase_orders",
      entityId: purchaseOrderId,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export type CreateLogisticsGoodsReceiptInput = {
  warehouseId?: string | null;
  purchaseOrderId?: string | null;
  productId: string;
  qtyReceived: number;
  purchaseOrderLineId?: string | null;
};

export async function createLogisticsGoodsReceipt(
  userId: string,
  input: CreateLogisticsGoodsReceiptInput,
) {
  await assertLogisticsWriteActionAllowed(userId, LOGISTICS_WRITE_ACTIONS.RECEIPT_CREATE, "create");

  const qty = Math.max(1, Math.floor(Number(input.qtyReceived)));
  const supabase = getSupabaseServerClient();
  const warehouseId = input.warehouseId ?? (await getDefaultWarehouseId(supabase));
  const receiptRef = refCode("GR");

  const { data: receipt, error: recErr } = await supabase
    .from("logistics_goods_receipts")
    .insert({
      receipt_ref: receiptRef,
      warehouse_id: warehouseId,
      purchase_order_id: input.purchaseOrderId ?? null,
      created_by: userId,
    })
    .select("id,receipt_ref,warehouse_id")
    .single();

  if (recErr) throw new Error(recErr.message);

  const { error: lineErr } = await supabase.from("logistics_goods_receipt_lines").insert({
    receipt_id: receipt.id,
    product_id: input.productId,
    qty_received: qty,
    purchase_order_line_id: input.purchaseOrderLineId ?? null,
  });

  if (lineErr) throw new Error(lineErr.message);

  await Promise.all([
    emitSupplyInventoryReceived({
      actorUserId: userId,
      receiptId: receipt.id,
      warehouseId: receipt.warehouse_id,
      lineCount: 1,
      totalQty: qty,
    }),
    recordLogisticsGovernanceAudit({
      actionType: LOGISTICS_WRITE_ACTIONS.RECEIPT_CREATE,
      entityType: "logistics_goods_receipts",
      entityId: receipt.id,
      afterSnapshot: { receipt, qty_received: qty },
    }),
  ]);

  return receipt;
}

export async function adjustLogisticsStock(
  userId: string,
  input: {
    warehouseId?: string | null;
    productId: string;
    qtyDelta: number;
    reason?: string | null;
  },
) {
  await assertLogisticsWriteActionAllowed(userId, LOGISTICS_WRITE_ACTIONS.STOCK_ADJUST, "create");

  const qtySigned = Math.trunc(Number(input.qtyDelta));
  if (qtySigned === 0) throw new Error("La quantité ajustée ne peut pas être nulle.");

  const supabase = getSupabaseServerClient();
  const warehouseId = input.warehouseId ?? (await getDefaultWarehouseId(supabase));

  const { data: movement, error } = await supabase
    .from("logistics_stock_movements")
    .insert({
      warehouse_id: warehouseId,
      product_id: input.productId,
      movement_type: "adjustment",
      qty_signed: qtySigned,
      reference_type: "stock_adjustment",
      reference_id: refCode("ADJ"),
      metadata: { reason: input.reason ?? null },
      created_by: userId,
    })
    .select("id,warehouse_id,product_id,qty_signed")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitSupplyStockAdjusted({
      actorUserId: userId,
      movementId: movement.id,
      productId: movement.product_id,
      qtySigned: movement.qty_signed,
      warehouseId: movement.warehouse_id,
    }),
    recordLogisticsGovernanceAudit({
      actionType: LOGISTICS_WRITE_ACTIONS.STOCK_ADJUST,
      entityType: "logistics_stock_movements",
      entityId: movement.id,
      afterSnapshot: movement,
    }),
  ]);

  return movement;
}

export async function transferLogisticsStock(
  userId: string,
  input: {
    fromWarehouseId: string;
    toWarehouseId: string;
    productId: string;
    qty: number;
  },
) {
  await assertLogisticsWriteActionAllowed(userId, LOGISTICS_WRITE_ACTIONS.STOCK_TRANSFER, "create");

  const qty = Math.max(1, Math.floor(Number(input.qty)));
  if (input.fromWarehouseId === input.toWarehouseId) {
    throw new Error("Les entrepôts source et cible doivent être différents.");
  }

  const supabase = getSupabaseServerClient();
  const transferRef = refCode("TRF");

  const { error: outErr } = await supabase.from("logistics_stock_movements").insert({
    warehouse_id: input.fromWarehouseId,
    product_id: input.productId,
    movement_type: "transfer_out",
    qty_signed: -qty,
    reference_type: "stock_transfer",
    reference_id: transferRef,
    created_by: userId,
  });

  if (outErr) throw new Error(outErr.message);

  const { data: inMov, error: inErr } = await supabase
    .from("logistics_stock_movements")
    .insert({
      warehouse_id: input.toWarehouseId,
      product_id: input.productId,
      movement_type: "transfer_in",
      qty_signed: qty,
      reference_type: "stock_transfer",
      reference_id: transferRef,
      created_by: userId,
    })
    .select("id")
    .single();

  if (inErr) throw new Error(inErr.message);

  await Promise.all([
    emitSupplyInventoryMoved({
      actorUserId: userId,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      productId: input.productId,
      qty,
    }),
    recordLogisticsGovernanceAudit({
      actionType: LOGISTICS_WRITE_ACTIONS.STOCK_TRANSFER,
      entityType: "logistics_stock_movements",
      entityId: inMov.id,
      afterSnapshot: { transfer_ref: transferRef, qty },
    }),
  ]);

  return { transferRef, inboundMovementId: inMov.id };
}
