export const NAV_LABELS = {
  home: "Accueil",
  dept: "Départements",
  actions: "Actions",
  /** Hub unique `/actions` — libelle officiel ERP (identite unique, pas d'alias "Synthese"). */
  actionsOverview: "Vue d'ensemble",
  archives: "Archives",
  /** Hub unique `/archives` — libelle officiel ERP. */
  archivesOverview: "Vue d'ensemble",
  admin: "Administration",
  config: "Configuration",
  settings: "Paramètres",
  /** Hub unique `/settings` — libellé officiel ERP. */
  settingsOverview: "Vue d'ensemble",
  rh: "Ressources humaines",
  logistics: "Logistique",
  formation: "Formation & Consultation",
  marketing: "Marketing",
  crm: "CRM",
  commerce: "Vente",
} as const;

/** Libellés français des sections du menu secondaire (clés techniques → produit). */
export const NAV_SECTION_LABELS: Record<string, string> = {
  PRINCIPAL: "Général",
  COMMERCE: "Commerce",
  CRM: "CRM",
  RH: "Ressources humaines",
  LOGISTIQUE: "Logistique",
  FORMATION: "Formation & Consultation",
  MARKETING: "Marketing",
  FINANCE: "Finance",
  OPERATIONS: "Opérations",
  ADMINISTRATION: "Administration",
};

