/**
 * P1 — Stratégie coexistence legacy (pas de suppression brutale).
 */

export const CRM_LEGACY_COEXISTENCE_VERSION = "crm-legacy-coexistence-p1-v1" as const;

export type CrmLegacyCoexistenceRow = {
  legacyMechanism: string;
  location: string;
  keepUntil: string;
  retirementCondition: string;
};

export const CRM_LEGACY_COEXISTENCE_TABLE: readonly CrmLegacyCoexistenceRow[] = [
  {
    legacyMechanism: "recordCrmGovernanceAudit",
    location: "modules/crm/server/services/crm-mutations.ts",
    keepUntil: "P3 — après handlers audit_bridge validés",
    retirementCondition: "Handler bus → governance_audit_events validé en prod 30j",
  },
  {
    legacyMechanism: "tryCreateAlert (approval)",
    location: "mutation-gate, admin/approvals",
    keepUntil: "P3 livré — retiré sur chemins bus",
    retirementCondition: "Remplacé par notification-approval-bridge + deliverInApp (P3). Legacy workflow.ts + HR conservés.",
  },
  {
    legacyMechanism: "revalidatePath",
    location: "actions diverses",
    keepUntil: "Indéfini (technique Next)",
    retirementCondition: "Hors scope bus — acceptable en parallèle",
  },
  {
    legacyMechanism: "lib/approvals/approval-engine.ts",
    location: "lib/approvals/",
    keepUntil: "Post B3.1 RLS extension",
    retirementCondition: "Wrapper vers bus ou dépréciation documentée",
  },
] as const;

export const CRM_LEGACY_COEXISTENCE_RULES = [
  "Ne jamais supprimer recordCrmGovernanceAudit avant handler validé.",
  "Publisher bus s'ajoute — ne remplace pas audit en P1/P1.1.",
  "Alerts restent jusqu'à notification handler prod.",
  "Ordre mutation : gate → DB → publisher → audit legacy.",
] as const;

export const CRM_LEGACY_MIGRATION_ROADMAP = [
  { phase: "P1", action: "Taxonomy + publishers + plans (sans câblage)" },
  { phase: "P1.1", action: "Câbler 3 mutations next + tests" },
  { phase: "P2", action: "notification bridge (read-only puis delivery)" },
  { phase: "P3", action: "Delivery in_app + retrait alerts approval (bus)" },
  { phase: "P3.1", action: "Retrait alerts HR / workflow legacy (hors scope bus)" },
  { phase: "P4", action: "Audit bridge optionnel" },
] as const;
