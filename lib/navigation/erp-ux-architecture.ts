/**
 * Architecture UX officielle M3 — contrat de référence (pas d’implémentation métier).
 * Sidebar · Cockpit · Homepage · KPI — à respecter pour tout build département.
 */
import { DEPARTMENT_KEYS, type DepartmentKey } from "@/lib/departments/department-config";

/** Pattern sidebar officiel ERP (M3). */
export const ERP_SIDEBAR_PATTERN = {
  /** Rail vertical unique, repliable, groupes expand/collapse — modèle Super Admin. */
  SINGLE_COLLAPSIBLE_RAIL: "single_collapsible_rail",
  /** Interdit pour nouveaux écrans métier. */
  FORBIDDEN_SECONDARY_COLUMN: "forbidden_secondary_column",
} as const;

/** Zones cockpit ordonnées (top → bottom). */
export const COCKPIT_ZONE_ORDER = [
  "context_header",
  "kpi_primary",
  "alerts",
  "charts",
  "recent_activity",
  "quick_actions",
] as const;

export type CockpitZoneId = (typeof COCKPIT_ZONE_ORDER)[number];

export type SidebarNavGroupSpec = {
  id: string;
  label: string;
  /** Sous-liens affichés sous le groupe repliable (profondeur max = 2). */
  links: readonly { href: string; label: string }[];
};

export type DepartmentSidebarArchitecture = {
  departmentKey: DepartmentKey;
  /** Route cockpit / landing manager (≠ help center). */
  cockpitRoute: string;
  /** Préfixe opérationnel racine. */
  operationalRoot: string;
  /** Groupes repliables du rail (pas de 2e colonne). */
  navGroups: readonly SidebarNavGroupSpec[];
};

export type DepartmentCockpitArchitecture = {
  departmentKey: DepartmentKey;
  route: string;
  /** KPI autorisés (ids logiques — mapping données au build métier). */
  primaryKpis: readonly string[];
  /** KPI / widgets interdits sur ce cockpit. */
  forbiddenGlobalKpis: readonly string[];
  zones: readonly CockpitZoneId[];
  quickActionHrefs: readonly string[];
};

/** Accueil global — réservé gouvernance. */
export const SUPER_ADMIN_COCKPIT_ROUTE = "/dashboard" as const;

/**
 * Architecture sidebar cible par département métier (M1 + M1.5).
 * CRM = groupe sous VENTE ; Consultation = sous-groupe FORMATION.
 */
export const OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE: Partial<
  Record<DepartmentKey, DepartmentSidebarArchitecture>
> = {
  [DEPARTMENT_KEYS.VENTE]: {
    departmentKey: DEPARTMENT_KEYS.VENTE,
    cockpitRoute: "/dept/vente",
    operationalRoot: "/vente/nouvelle-vente",
    navGroups: [
      {
        id: "commerce",
        label: "Commerce",
        links: [
          { href: "/vente/clients", label: "Clients" },
          { href: "/vente/produits", label: "Produits" },
          { href: "/vente/nouvelle-vente", label: "Nouvelle vente" },
          { href: "/vente/historique", label: "Historique" },
          { href: "/vente/statistiques", label: "Statistiques" },
        ],
      },
      {
        id: "crm",
        label: "CRM",
        links: [
          { href: "/vente/crm", label: "Pilotage CRM" },
          { href: "/vente/crm/leads", label: "Leads" },
          { href: "/vente/crm/pipeline", label: "Pipeline" },
          { href: "/vente/crm/opportunities", label: "Opportunités" },
          { href: "/vente/crm/quotes", label: "Devis" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.FINANCE]: {
    departmentKey: DEPARTMENT_KEYS.FINANCE,
    cockpitRoute: "/dept/finance",
    operationalRoot: "/finance",
    navGroups: [
      {
        id: "finance",
        label: "Finance",
        links: [
          { href: "/finance", label: "Vue d'ensemble" },
          { href: "/finance/depenses", label: "Dépenses" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.RH]: {
    departmentKey: DEPARTMENT_KEYS.RH,
    cockpitRoute: "/dept/rh",
    operationalRoot: "/rh",
    navGroups: [
      {
        id: "rh",
        label: "Ressources Humaines",
        links: [
          { href: "/rh/collaborateurs", label: "Collaborateurs" },
          { href: "/rh/conges", label: "Congés" },
          { href: "/rh/presences", label: "Présences" },
          { href: "/rh/fiches-de-paie", label: "Fiches de paie" },
          { href: "/rh/contrats", label: "Contrats" },
          { href: "/rh/recrutement", label: "Recrutement" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.FORMATION]: {
    departmentKey: DEPARTMENT_KEYS.FORMATION,
    cockpitRoute: "/dept/formation",
    operationalRoot: "/formation",
    navGroups: [
      {
        id: "formation",
        label: "Formation",
        links: [
          { href: "/formation/dashboard", label: "Pilotage" },
          { href: "/formation/formations", label: "Catalogue" },
          { href: "/formation/apprenants", label: "Apprenants" },
          { href: "/formation/inscriptions", label: "Inscriptions" },
          { href: "/formation/certificats", label: "Certificats" },
        ],
      },
      {
        id: "consultation",
        label: "Consultation",
        links: [
          { href: "/consultation/missions", label: "Missions" },
          { href: "/consultation/agenda", label: "Agenda" },
          { href: "/consultation/clients", label: "Clients" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.MARKETING]: {
    departmentKey: DEPARTMENT_KEYS.MARKETING,
    cockpitRoute: "/dept/marketing",
    operationalRoot: "/marketing",
    navGroups: [
      {
        id: "marketing",
        label: "Marketing",
        links: [
          { href: "/marketing/dashboard", label: "Pilotage" },
          { href: "/marketing/campagnes", label: "Campagnes" },
          { href: "/marketing/leads", label: "Leads" },
          { href: "/marketing/analytics", label: "Analytics" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.LOGISTIQUE]: {
    departmentKey: DEPARTMENT_KEYS.LOGISTIQUE,
    cockpitRoute: "/dept/logistique",
    operationalRoot: "/logistique",
    navGroups: [
      {
        id: "logistique",
        label: "Logistique",
        links: [
          { href: "/logistique/dashboard", label: "Pilotage" },
          { href: "/logistique/articles", label: "Articles" },
          { href: "/logistique/mouvements", label: "Mouvements" },
          { href: "/logistique/fournisseurs", label: "Fournisseurs" },
          { href: "/logistique/achats", label: "Commandes" },
        ],
      },
      {
        id: "logistique-avance",
        label: "Avancé",
        links: [
          { href: "/logistique/stock", label: "Stock multi-sites" },
          { href: "/logistique/entrepots", label: "Entrepôts" },
          { href: "/logistique/dashboard", label: "Pilotage département" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.ADMINISTRATION]: {
    departmentKey: DEPARTMENT_KEYS.ADMINISTRATION,
    cockpitRoute: "/dashboard",
    operationalRoot: "/actions",
    navGroups: [
      {
        id: "actions",
        label: "Gouvernance",
        links: [
          { href: "/actions", label: "Centre d'actions" },
          { href: "/admin/platform-dashboard", label: "Plateforme" },
          { href: "/admin/approvals", label: "Approbations" },
          { href: "/admin/activity-logs", label: "Journaux d'activité" },
        ],
      },
    ],
  },
};

/** Widgets / patterns interdits sur cockpits départementaux (M3). */
export const FORBIDDEN_DEPT_COCKPIT_PATTERNS = [
  "welcome_onboarding_cards",
  "governance_rules_text_blocks",
  "global_executive_kpi_strip",
  "other_department_supervision_cards",
  "help_center_layout",
] as const;
