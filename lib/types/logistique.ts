export type StockStatus = "normal" | "low" | "out";
export type MovementType = "in" | "out" | "adjust" | "transfer";
export type PurchaseOrderStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "received"
  | "cancelled";

export type StockItem = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_price_gnf: number;
  warehouse_id: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  warehouse?: { code: string; label: string } | null;
};

export type StockMovement = {
  id: string;
  item_id: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  warehouse_from: string | null;
  warehouse_to: string | null;
  created_by: string | null;
  created_at: string;
  item?: { name: string; sku: string | null; unit: string } | null;
  warehouseFromMeta?: { code: string; label: string } | null;
  warehouseToMeta?: { code: string; label: string } | null;
};

export type Supplier = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  category: string | null;
  is_active: boolean;
  supplier_code: string;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrderItem = {
  item_name: string;
  quantity: number;
  unit_price_gnf: number;
};

export type PurchaseOrder = {
  id: string;
  reference: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  total_amount_gnf: number;
  expected_date: string | null;
  notes: string | null;
  approval_request_id: string | null;
  approved_at: string | null;
  received_at: string | null;
  cancelled_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: { company_name: string; supplier_code: string } | null;
};

export type CreateStockItemInput = {
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  unit_price_gnf?: number;
  warehouse_id?: string;
  description?: string;
  created_by?: string;
};

export type UpdateStockItemInput = Partial<
  Omit<CreateStockItemInput, "created_by">
>;

export type RecordStockMovementInput = {
  item_id: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  warehouse_from?: string;
  warehouse_to?: string;
  created_by?: string;
};

export type CreateSupplierInput = {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  is_active?: boolean;
};

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export type CreatePurchaseOrderInput = {
  supplier_id: string;
  items: PurchaseOrderItem[];
  expected_date?: string;
  notes?: string;
  created_by?: string;
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  in: "Entrée",
  out: "Sortie",
  adjust: "Ajustement",
  transfer: "Transfert",
};

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Brouillon",
  submitted: "Soumise",
  approved: "Approuvée",
  received: "Reçue",
  cancelled: "Annulée",
};

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  normal: "En stock",
  low: "Stock bas",
  out: "Rupture",
};

export function computeStockStatus(item: {
  quantity: number;
  min_quantity: number;
}): StockStatus {
  const qty = Number(item.quantity ?? 0);
  const min = Number(item.min_quantity ?? 0);
  if (qty <= 0) return "out";
  if (qty <= min) return "low";
  return "normal";
}
