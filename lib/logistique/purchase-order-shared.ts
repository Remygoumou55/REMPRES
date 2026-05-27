export type PurchaseOrderStatus = "pending" | "confirmed" | "received" | "cancelled";

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  received: "Reçue",
  cancelled: "Annulée",
};

export const PO_STATUS_COLORS: Record<PurchaseOrderStatus, { bg: string; text: string }> = {
  pending: { bg: "#F1EFE8", text: "#444441" },
  confirmed: { bg: "#E6F1FB", text: "#0C447C" },
  received: { bg: "#EAF3DE", text: "#27500A" },
  cancelled: { bg: "#FCEBEB", text: "#791F1F" },
};

export const PO_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["received", "cancelled"],
  received: [],
  cancelled: [],
};
