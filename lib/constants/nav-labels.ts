export const NAV_LABELS = {
  home: "Accueil",
  dept: "Départements",
  actions: "Actions",
  archives: "Archives",
  admin: "Administration",
  config: "Configuration",
  settings: "Paramètres",
  rh: "Ressources humaines",
  logistics: "Logistique",
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
  FINANCE: "Finance",
  OPERATIONS: "Opérations",
  ADMINISTRATION: "Administration",
};

