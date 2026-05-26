import type { GovernanceApprovalRequest } from "@/lib/governance/approvals/types";
import {
  getApprovalDescription,
  getApprovalTitle,
  timeAgo,
} from "@/lib/constants/human-messages";

const DEPARTMENT_LABELS: Record<string, string> = {
  finance: "Finance",
  vente: "Vente",
  rh: "Ressources humaines",
  logistics: "Logistique",
  logistique: "Logistique",
  crm: "CRM",
  admin: "Administration",
  direction: "Direction",
  formation: "Formation",
  consultation: "Consultation",
  marketing: "Marketing",
};

function humanizeKey(value: string): string {
  const v = value.trim();
  if (!v) return "—";
  return v
    .replace(/[._]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Titre principal lisible pour les opérateurs (sans jargon technique brut). */
export function getApprovalCardTitle(request: GovernanceApprovalRequest): string {
  return getApprovalTitle({ action_type: request.actionType });
}

/** Phrase humaine : qui souhaite faire quoi sur quel élément. */
export function getApprovalCardScope(request: GovernanceApprovalRequest): string {
  return getApprovalDescription({
    action_type: request.actionType,
    entity_type: request.entityType,
    operation: request.operation,
    requester_name: request.requesterName,
    entity_label: request.targetLabel,
  });
}

/** Ligne méta : demandeur + département + horodatage relatif. */
export function getApprovalCardMeta(request: GovernanceApprovalRequest): string {
  const departmentKey = String(request.departmentKey ?? "").trim();
  const dept =
    DEPARTMENT_LABELS[departmentKey.toLowerCase()] ?? humanizeKey(departmentKey);
  const who = request.requesterName?.trim() || "—";
  const when = timeAgo(request.requestedAt ?? request.createdAt);
  return [
    `Demandé par : ${who}`,
    `Département : ${dept}`,
    when ? when : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
