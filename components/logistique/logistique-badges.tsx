import { memo } from "react";
import {
  MOVEMENT_TYPE_LABELS,
  PO_STATUS_LABELS,
  STOCK_STATUS_LABELS,
  type MovementType,
  type PurchaseOrderStatus,
  type StockStatus,
} from "@/lib/types/logistique";

const STOCK_STYLES: Record<StockStatus, string> = {
  normal: "bg-emerald-100 text-emerald-800",
  low: "bg-amber-100 text-amber-800",
  out: "bg-red-100 text-red-800",
};

function StockStatusBadgeInner({ status }: { status: StockStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STOCK_STYLES[status]}`}>
      {STOCK_STATUS_LABELS[status]}
    </span>
  );
}
export const StockStatusBadge = memo(StockStatusBadgeInner);

const MOVEMENT_STYLES: Record<MovementType, string> = {
  in: "bg-emerald-100 text-emerald-800",
  out: "bg-red-100 text-red-800",
  adjust: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
};

function MovementTypeBadgeInner({ type }: { type: MovementType }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${MOVEMENT_STYLES[type]}`}>
      {MOVEMENT_TYPE_LABELS[type]}
    </span>
  );
}
export const MovementTypeBadge = memo(MovementTypeBadgeInner);

const PO_STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  received: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

function PurchaseOrderStatusBadgeInner({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PO_STATUS_STYLES[status]}`}>
      {PO_STATUS_LABELS[status]}
    </span>
  );
}
export const PurchaseOrderStatusBadge = memo(PurchaseOrderStatusBadgeInner);

function SupplierStatusBadgeInner({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
      }`}
    >
      {isActive ? "Actif" : "Inactif"}
    </span>
  );
}
export const SupplierStatusBadge = memo(SupplierStatusBadgeInner);
