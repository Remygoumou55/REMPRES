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
    cockpitRoute: "/vente/dashboard",
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
    cockpitRoute: "/finance/dashboard",
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
    cockpitRoute: "/rh/dashboard",
    operationalRoot: "/rh",
    navGroups: [
      {
        id: "rh",
        label: "Ressources humaines",
        links: [
          { href: "/rh", label: "Pilotage RH" },
          { href: "/rh/collaborateurs", label: "Collaborateurs" },
          { href: "/rh/contrats", label: "Contrats" },
          { href: "/rh/recrutement", label: "Recrutement" },
          { href: "/rh/presences", label: "Présences" },
          { href: "/rh/conges", label: "Congés" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.FORMATION]: {
    departmentKey: DEPARTMENT_KEYS.FORMATION,
    cockpitRoute: "/formation/dashboard",
    operationalRoot: "/formation",
    navGroups: [
      {
        id: "formation",
        label: "Formation & Consultation",
        links: [
          { href: "/formation/dashboard", label: "Pilotage" },
          { href: "/formation", label: "Formation" },
          { href: "/consultation/dashboard", label: "Consultation" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.MARKETING]: {
    departmentKey: DEPARTMENT_KEYS.MARKETING,
    cockpitRoute: "/marketing/dashboard",
    operationalRoot: "/marketing",
    navGroups: [
      {
        id: "marketing",
        label: "Marketing",
        links: [
          { href: "/marketing/dashboard", label: "Pilotage" },
          { href: "/marketing", label: "Campagnes" },
        ],
      },
    ],
  },
  [DEPARTMENT_KEYS.LOGISTIQUE]: {
    departmentKey: DEPARTMENT_KEYS.LOGISTIQUE,
    cockpitRoute: "/logistique/dashboard",
    operationalRoot: "/logistique",
    navGroups: [
      {
        id: "logistique",
        label: "Logistique",
        links: [
          { href: "/logistique", label: "Pilotage" },
          { href: "/logistique/stock", label: "Stock" },
          { href: "/logistique/mouvements", label: "Mouvements" },
          { href: "/logistique/entrepots", label: "Entrepôts" },
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
