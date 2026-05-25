/**
 * Bloc 3 — Publishers officiels — Supply / Logistique.
 */

import { publishIntegrationOfficialEvent } from "@/lib/erp-core/events/integrations/integration-publish";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";
import { LOGISTICS_DEPARTMENT_KEY } from "@/modules/logistics/constants/module-keys";

export async function emitSupplySupplierCreated(params: {
  actorUserId: string;
  supplierId: string;
  supplierCode: string;
  companyName: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.SUPPLY_SUPPLIER_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: LOGISTICS_DEPARTMENT_KEY,
    entityType: "logistics_suppliers",
    entityId: params.supplierId,
    correlationId: params.supplierId,
    payload: {
      supplier_code: params.supplierCode,
      company_name: params.companyName,
    },
  });
}

export async function emitSupplyPurchaseRequested(params: {
  actorUserId: string;
  purchaseOrderId: string;
  poNumber: string;
  amountGnf: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PURCHASE_REQUESTED, {
    actorUserId: params.actorUserId,
    departmentKey: LOGISTICS_DEPARTMENT_KEY,
    entityType: "logistics_purchase_orders",
    entityId: params.purchaseOrderId,
    correlationId: params.purchaseOrderId,
    payload: { po_number: params.poNumber, amount_gnf: params.amountGnf },
  });
}

export async function emitSupplyPurchaseApproved(params: {
  actorUserId: string;
  purchaseOrderId: string;
  poNumber: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PURCHASE_APPROVED, {
    actorUserId: params.actorUserId,
    departmentKey: LOGISTICS_DEPARTMENT_KEY,
    entityType: "logistics_purchase_orders",
    entityId: params.purchaseOrderId,
    correlationId: params.purchaseOrderId,
    payload: { po_number: params.poNumber },
  });
}

export async function emitSupplyPoCreated(params: {
  actorUserId: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  totalEstimatedGnf: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.SUPPLY_PO_CREATED, {
    actorUserId: params.actorUserId,
    departmentKey: LOGISTICS_DEPARTMENT_KEY,
    entityType: "logistics_purchase_orders",
    entityId: params.purchaseOrderId,
    correlationId: params.purchaseOrderId,
    payload: {
      po_number: params.poNumber,
      supplier_id: params.supplierId,
      total_estimated_gnf: params.totalEstimatedGnf,
    },
  });
}

export async function emitSupplyInventoryReceived(params: {
  actorUserId: string;
  receiptId: string;
  warehouseId: string;
  lineCount: number;
  totalQty: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.SUPPLY_INVENTORY_RECEIVED, {
    actorUserId: params.actorUserId,
    departmentKey: LOGISTICS_DEPARTMENT_KEY,
    entityType: "logistics_goods_receipts",
    entityId: params.receiptId,
    correlationId: params.receiptId,
    payload: {
      warehouse_id: params.warehouseId,
      line_count: params.lineCount,
      total_qty: params.totalQty,
    },
  });
}

export async function emitSupplyStockAdjusted(params: {
  actorUserId: string;
  movementId: string;
  productId: string;
  qtySigned: number;
  warehouseId: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.SUPPLY_STOCK_ADJUSTED, {
    actorUserId: params.actorUserId,
    departmentKey: LOGISTICS_DEPARTMENT_KEY,
    entityType: "logistics_stock_movements",
    entityId: params.movementId,
    correlationId: params.movementId,
    payload: {
      product_id: params.productId,
      qty_signed: params.qtySigned,
      warehouse_id: params.warehouseId,
    },
  });
}

export async function emitSupplyInventoryMoved(params: {
  actorUserId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  qty: number;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.SUPPLY_INVENTORY_MOVED, {
    actorUserId: params.actorUserId,
    departmentKey: LOGISTICS_DEPARTMENT_KEY,
    entityType: "logistics_stock_movements",
    entityId: `${params.fromWarehouseId}:${params.toWarehouseId}:${params.productId}`,
    correlationId: params.productId,
    payload: {
      from_warehouse_id: params.fromWarehouseId,
      to_warehouse_id: params.toWarehouseId,
      product_id: params.productId,
      qty: params.qty,
    },
  });
}

export async function emitSupplyReportGenerated(params: {
  actorUserId: string;
  reportId: string;
  reportType: string;
}): Promise<void> {
  await publishIntegrationOfficialEvent(OFFICIAL_ERP_EVENT_TYPES.SUPPLY_REPORT_GENERATED, {
    actorUserId: params.actorUserId,
    departmentKey: LOGISTICS_DEPARTMENT_KEY,
    entityType: "supply_report",
    entityId: params.reportId,
    correlationId: params.reportId,
    payload: { report_type: params.reportType },
  });
}
