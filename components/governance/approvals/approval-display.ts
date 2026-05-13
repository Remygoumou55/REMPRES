import type { GovernanceApprovalRequest } from "@/lib/governance/approvals/types";

const DEPARTMENT_LABELS: Record<string, string> = {
  finance: "Finance",
  vente: "Vente",
  rh: "Ressources humaines",
  logistics: "Logistique",
  logistique: "Logistique",
  crm: "CRM",
  admin: "Administration",
  direction: "Direction",
};

function humanizeKey(value: string): string {
  const v = value.trim();
  if (!v) return "—";
  return v
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortRef(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…`;
}

/** Titre principal lisible pour les opérateurs (sans jargon technique brut). */
export function getApprovalCardTitle(request: GovernanceApprovalRequest): string {
  const action = request.actionType.toLowerCase();
  if (action.includes("delete") || action.includes("remove")) {
    return "Demande de suppression";
  }
  if (action.includes("create") || action.includes("insert")) {
    return "Demande de création";
  }
  if (action.includes("update") || action.includes("edit") || action.includes("modify")) {
    return "Demande de modification";
  }
  if (action.includes("approve") || action.includes("validation")) {
    return "Demande de validation";
  }
  return `Demande : ${humanizeKey(request.actionType)}`;
}

/** Sous-titre : périmètre métier + référence courte. */
export function getApprovalCardScope(request: GovernanceApprovalRequest): string {
  const entity = humanizeKey(request.entityType);
  return `Objet : ${entity} · Réf. ${shortRef(request.entityId)}`;
}

/** Ligne méta : département + demandeur. */
export function getApprovalCardMeta(request: GovernanceApprovalRequest): string {
  const dept =
    DEPARTMENT_LABELS[request.departmentKey.toLowerCase()] ??
    humanizeKey(request.departmentKey);
  const who = request.requestedBy?.trim() ? request.requestedBy : "—";
  return `Département : ${dept} · Demandé par : ${who}`;
}
