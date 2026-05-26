/**
 * Human-readable French labels for approval and alert surfaces.
 *
 * Keys are normalised to lowercase + snake_case to tolerate the historical
 * mix of legacy uppercase (DELETE_PRODUCT) and current lowercase
 * (delete_product) values stored in approval_requests.action_type.
 */

export type ApprovalContext = {
  action_type?: string | null;
  entity_type?: string | null;
  operation?: string | null;
  requester_name?: string | null;
  entity_label?: string | null;
  metadata?: Record<string, unknown> | null;
};

function normalizeKey(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase().replace(/[-\s]+/g, "_");
}

// ---------------------------------------------------------------------------
// Entity labels (entity_type → "produit", "client", …)
// ---------------------------------------------------------------------------

export const ENTITY_LABELS: Record<string, string> = {
  products: "produit",
  product: "produit",
  clients: "client",
  client: "client",
  employees: "employé",
  employee: "employé",
  sales: "vente",
  sale: "vente",
  vente: "vente",
  expenses: "dépense",
  expense: "dépense",
  trainings: "formation",
  training: "formation",
  formation: "formation",
  missions: "mission",
  mission: "mission",
  campaigns: "campagne",
  campaign: "campagne",
  leads: "lead",
  lead: "lead",
  leave_requests: "demande de congé",
  purchase_orders: "commande d'achat",
  simple_purchase_orders: "commande d'achat",
  financial_transactions: "transaction financière",
  approval_requests: "demande d'approbation",
  users: "utilisateur",
  stock_items: "article",
  logistique: "article",
  rh: "employé",
  consultation: "mission",
  default: "élément",
};

function entityArticle(entity: string): string {
  if (!entity) return "l'élément";
  const feminineEntities = new Set([
    "vente",
    "dépense",
    "formation",
    "mission",
    "campagne",
    "demande de congé",
    "commande d'achat",
    "transaction financière",
    "demande d'approbation",
  ]);
  if (feminineEntities.has(entity)) return "la " + entity;
  // Words starting with vowels take "l'".
  if (/^[aeiouéèàâ]/i.test(entity)) return "l'" + entity;
  return "le " + entity;
}

export function getEntityLabel(entityType: string | null | undefined): string {
  const key = normalizeKey(entityType);
  return ENTITY_LABELS[key] ?? ENTITY_LABELS.default;
}

// ---------------------------------------------------------------------------
// Action titles (action_type → "Suppression d'un produit", …)
// ---------------------------------------------------------------------------

export const ACTION_TITLES: Record<string, string> = {
  delete_product: "Suppression d'un produit",
  delete_client: "Suppression d'un client",
  delete_employee: "Suppression d'un employé",
  delete_sale: "Suppression d'une vente",
  delete_mission: "Suppression d'une mission",
  delete_stock_item: "Suppression d'un article",
  delete_campaign: "Suppression d'une campagne",
  delete_lead: "Suppression d'un lead",
  cancel_sale: "Annulation d'une vente",
  cancel_formation: "Annulation d'une formation",
  approve_purchase_order: "Approbation d'une commande d'achat",
  approve_expense: "Approbation d'une dépense",
  approve_leave: "Approbation d'un congé",
  large_expense: "Dépense importante à valider",
  create_user: "Création d'un utilisateur",
  update_permissions: "Modification des permissions",
  export_data: "Export de données",
  approve_financial_transaction: "Approbation d'une transaction financière",
  default: "Demande d'approbation",
};

// ---------------------------------------------------------------------------
// Operation verbs (payload_snapshot.operation → "supprimer", …)
// ---------------------------------------------------------------------------

export const OPERATION_LABELS: Record<string, string> = {
  soft_delete: "supprimer",
  delete: "supprimer",
  remove: "supprimer",
  hard_delete: "supprimer définitivement",
  cancel: "annuler",
  approve: "approuver",
  validate: "valider",
  create: "créer",
  insert: "créer",
  update: "modifier",
  edit: "modifier",
  modify: "modifier",
  export: "exporter",
  default: "traiter",
};

function inferOperationFromAction(actionType: string): string {
  const a = actionType;
  if (a.startsWith("delete_") || a.includes("delete")) return "soft_delete";
  if (a.startsWith("cancel_") || a.includes("cancel")) return "cancel";
  if (a.startsWith("approve_") || a.includes("approve")) return "approve";
  if (a.startsWith("create_") || a.includes("create")) return "create";
  if (a.startsWith("update_") || a.includes("update")) return "update";
  if (a.startsWith("export_") || a.includes("export")) return "export";
  return "default";
}

function entityFromActionType(actionType: string): string {
  const a = actionType;
  // Try to extract the entity from the suffix.
  const segments = a.split("_");
  if (segments.length >= 2) {
    return segments.slice(1).join("_");
  }
  return "";
}

// ---------------------------------------------------------------------------
// Human title + description helpers
// ---------------------------------------------------------------------------

export function getApprovalTitle(ctx: ApprovalContext): string {
  const key = normalizeKey(ctx.action_type);
  if (key && ACTION_TITLES[key]) return ACTION_TITLES[key];
  return ACTION_TITLES.default;
}

export function getApprovalDescription(ctx: ApprovalContext): string {
  const actionKey = normalizeKey(ctx.action_type);
  const operationKey = normalizeKey(ctx.operation) || inferOperationFromAction(actionKey);
  const operation = OPERATION_LABELS[operationKey] ?? OPERATION_LABELS.default;

  const entityKey =
    normalizeKey(ctx.entity_type) || entityFromActionType(actionKey);
  const entity = getEntityLabel(entityKey);

  const requester = (ctx.requester_name ?? "").trim() || "Un utilisateur";
  const article = entityArticle(entity);
  const label = ctx.entity_label?.trim() ? ` « ${ctx.entity_label.trim()} »` : "";

  return `${requester} souhaite ${operation} ${article}${label}.`;
}

// ---------------------------------------------------------------------------
// Status labels and colors
// ---------------------------------------------------------------------------

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
  cancelled: "Annulé",
  executed: "Exécuté",
  expired: "Expiré",
};

export const STATUS_COLORS: Record<string, "amber" | "green" | "red" | "gray" | "blue"> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
  cancelled: "gray",
  executed: "green",
  expired: "gray",
};

export function getStatusLabel(status: string | null | undefined): string {
  const key = normalizeKey(status);
  return STATUS_LABELS[key] ?? STATUS_LABELS.pending;
}

// ---------------------------------------------------------------------------
// Button labels
// ---------------------------------------------------------------------------

export const BUTTON_LABELS = {
  acknowledge: "Marquer comme lu",
  resolve: "Traiter ce problème",
  ignore: "Ignorer cette alerte",
  approve: "Approuver",
  reject: "Refuser",
  viewDetail: "Voir le détail",
  cancel: "Annuler",
} as const;

// ---------------------------------------------------------------------------
// Alert type labels
// ---------------------------------------------------------------------------

export const ALERT_TYPE_LABELS: Record<string, string> = {
  low_stock: "Stock bas",
  out_of_stock: "Rupture de stock",
  payment_due: "Paiement en attente",
  payment_overdue: "Paiement en retard",
  leave_request: "Demande de congé",
  approval_needed: "Approbation requise",
  approval_required: "Approbation requise",
  approval_request_created: "Approbation requise",
  approval_request_pending: "Approbation requise",
  approval_granted: "Demande approuvée",
  approval_rejected: "Demande refusée",
  error: "Erreur système",
  warning: "Avertissement",
  info: "Information",
  default: "Notification",
};

export function getAlertTypeLabel(type: string | null | undefined): string {
  const key = normalizeKey(type);
  return ALERT_TYPE_LABELS[key] ?? ALERT_TYPE_LABELS.default;
}

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "";
  const ts = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (!Number.isFinite(ts)) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}
