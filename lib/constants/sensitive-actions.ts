export type ApprovalActionType =
  | "delete_sale"
  | "delete_client"
  | "delete_product"
  | "large_expense"
  | "delete_employee"
  | "cancel_formation"
  | "delete_mission";

export type ApprovalPriority = "low" | "normal" | "high" | "critical";

export const SENSITIVE_ACTIONS = {
  DELETE_SALE: {
    type: "delete_sale" as ApprovalActionType,
    module: "vente",
    priority: "high" as ApprovalPriority,
    description: (label: string) => `Demande de suppression de la vente : ${label}`,
  },

  DELETE_CLIENT: {
    type: "delete_client" as ApprovalActionType,
    module: "vente",
    priority: "normal" as ApprovalPriority,
    description: (label: string) => `Demande de suppression du client : ${label}`,
  },

  DELETE_PRODUCT: {
    type: "delete_product" as ApprovalActionType,
    module: "vente",
    priority: "normal" as ApprovalPriority,
    description: (label: string) => `Demande de suppression du produit : ${label}`,
  },

  LARGE_EXPENSE: {
    type: "large_expense" as ApprovalActionType,
    module: "finance",
    priority: "high" as ApprovalPriority,
    threshold_gnf: 1_000_000,
    description: (label: string) => `Demande d'approbation pour une dépense : ${label}`,
  },

  DELETE_EMPLOYEE: {
    type: "delete_employee" as ApprovalActionType,
    module: "rh",
    priority: "critical" as ApprovalPriority,
    description: (label: string) => `Demande de suppression de l'employé : ${label}`,
  },

  CANCEL_FORMATION: {
    type: "cancel_formation" as ApprovalActionType,
    module: "formation",
    priority: "high" as ApprovalPriority,
    description: (label: string) => `Demande d'annulation de la formation : ${label}`,
  },

  DELETE_MISSION: {
    type: "delete_mission" as ApprovalActionType,
    module: "consultation",
    priority: "high" as ApprovalPriority,
    description: (label: string) => `Demande de suppression de la mission : ${label}`,
  },
} as const;

export function expenseRequiresApproval(amountGnf: number): boolean {
  return amountGnf >= SENSITIVE_ACTIONS.LARGE_EXPENSE.threshold_gnf;
}

export const ACTION_TYPE_LABELS: Record<string, string> = {
  delete_sale: "Suppression de vente",
  delete_client: "Suppression de client",
  delete_product: "Suppression de produit",
  large_expense: "Dépense importante",
  delete_employee: "Suppression d'employé",
  cancel_formation: "Annulation de formation",
  delete_mission: "Suppression de mission",
};
