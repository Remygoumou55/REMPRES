/**
 * Référentiel métier des départements (clés canoniques = celles de `public.departments.key`).
 * Navigation ERP : routes « dashboard » et « opérationnel » — source unique pour guards et redirections.
 */
export const DEPARTMENT_KEYS = {
  VENTE: "VENTE",
  FINANCE: "FINANCE",
  RH: "RH",
  FORMATION: "FORMATION",
  CONSULTATION: "CONSULTATION",
  MARKETING: "MARKETING",
  LOGISTIQUE: "LOGISTIQUE",
  ADMINISTRATION: "ADMINISTRATION",
  AUDIT: "AUDIT",
} as const;

export type DepartmentKey = (typeof DEPARTMENT_KEYS)[keyof typeof DEPARTMENT_KEYS];

/** Icônes Lucide (nom du symbole) — utilisées par la shell / futures évolutions sans importer lucide ici. */
export type DepartmentNavIcon =
  | "ShoppingCart"
  | "Wallet"
  | "Users"
  | "GraduationCap"
  | "Headphones"
  | "Megaphone"
  | "Truck"
  | "Building2"
  | "ClipboardList";

export type DepartmentNavigationSpec = {
  /** Libellé affiché (formulaires / menus). */
  label: string;
  /** Landing chef de département (manager). */
  dashboardRoute: string;
  /** Entrée opérationnelle principale (agent). */
  operationalRootRoute: string;
  /** Préfixes URL réservés à ce département pour les gardes « anti-cross-dept ». */
  routePrefixes: readonly string[];
  /** Pas de mutations métier directes depuis cet axe (supervision / audit). */
  supervisionOnly: boolean;
  icon: DepartmentNavIcon;
  supervision: {
    kpi: boolean;
    alerts: boolean;
    history: boolean;
    archives: boolean;
    analytics: boolean;
  };
};

/** Navigation canonique par département — base pour redirections et garde-fous middleware. */
export const DEPARTMENT_NAVIGATION: Record<DepartmentKey, DepartmentNavigationSpec> = {
  [DEPARTMENT_KEYS.VENTE]: {
    label: "Vente",
    dashboardRoute: "/dept/vente",
    operationalRootRoute: "/vente/nouvelle-vente",
    routePrefixes: ["/vente"],
    supervisionOnly: false,
    icon: "ShoppingCart",
    supervision: { kpi: true, alerts: true, history: true, archives: true, analytics: true },
  },
  [DEPARTMENT_KEYS.FINANCE]: {
    label: "Finance",
    dashboardRoute: "/dept/finance",
    operationalRootRoute: "/finance",
    routePrefixes: ["/finance"],
    supervisionOnly: false,
    icon: "Wallet",
    supervision: { kpi: true, alerts: true, history: true, archives: true, analytics: true },
  },
  [DEPARTMENT_KEYS.RH]: {
    label: "RH",
    dashboardRoute: "/dept/rh",
    operationalRootRoute: "/rh",
    routePrefixes: ["/rh"],
    supervisionOnly: false,
    icon: "Users",
    supervision: { kpi: true, alerts: true, history: true, archives: true, analytics: true },
  },
  [DEPARTMENT_KEYS.FORMATION]: {
    label: "Formation",
    dashboardRoute: "/dept/formation",
    operationalRootRoute: "/formation",
    routePrefixes: ["/formation"],
    supervisionOnly: false,
    icon: "GraduationCap",
    supervision: { kpi: true, alerts: true, history: true, archives: true, analytics: true },
  },
  [DEPARTMENT_KEYS.CONSULTATION]: {
    label: "Consultation",
    dashboardRoute: "/dept/consultation",
    operationalRootRoute: "/consultation",
    routePrefixes: ["/consultation"],
    supervisionOnly: false,
    icon: "Headphones",
    supervision: { kpi: true, alerts: true, history: true, archives: true, analytics: true },
  },
  [DEPARTMENT_KEYS.MARKETING]: {
    label: "Marketing",
    dashboardRoute: "/dept/marketing",
    operationalRootRoute: "/marketing",
    routePrefixes: ["/marketing"],
    supervisionOnly: false,
    icon: "Megaphone",
    supervision: { kpi: true, alerts: true, history: true, archives: true, analytics: true },
  },
  [DEPARTMENT_KEYS.LOGISTIQUE]: {
    label: "Logistique",
    dashboardRoute: "/dept/logistique",
    operationalRootRoute: "/logistique",
    routePrefixes: ["/logistique"],
    supervisionOnly: false,
    icon: "Truck",
    supervision: { kpi: true, alerts: true, history: true, archives: true, analytics: true },
  },
  [DEPARTMENT_KEYS.ADMINISTRATION]: {
    label: "Administration",
    dashboardRoute: "/dashboard",
    operationalRootRoute: "/dashboard",
    routePrefixes: [],
    supervisionOnly: true,
    icon: "Building2",
    supervision: { kpi: false, alerts: true, history: true, archives: true, analytics: true },
  },
  [DEPARTMENT_KEYS.AUDIT]: {
    label: "Audit interne",
    dashboardRoute: "/admin/activity-logs",
    operationalRootRoute: "/admin/activity-logs",
    routePrefixes: ["/admin/activity-logs"],
    supervisionOnly: true,
    icon: "ClipboardList",
    supervision: { kpi: false, alerts: true, history: true, archives: true, analytics: true },
  },
};

export function listSupervisedDepartments(): DepartmentKey[] {
  return Object.entries(DEPARTMENT_NAVIGATION)
    .filter(([, nav]) => !nav.supervisionOnly && nav.routePrefixes.length > 0)
    .map(([key]) => key as DepartmentKey);
}

/** Options formulaires invitation / édition (valeur = clé canonique). */
export const DEPARTMENT_OPTIONS_UI: readonly { key: DepartmentKey; label: string }[] = [
  { key: DEPARTMENT_KEYS.VENTE, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.VENTE].label },
  { key: DEPARTMENT_KEYS.FINANCE, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.FINANCE].label },
  { key: DEPARTMENT_KEYS.RH, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.RH].label },
  { key: DEPARTMENT_KEYS.FORMATION, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.FORMATION].label },
  { key: DEPARTMENT_KEYS.CONSULTATION, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.CONSULTATION].label },
  { key: DEPARTMENT_KEYS.MARKETING, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.MARKETING].label },
  { key: DEPARTMENT_KEYS.LOGISTIQUE, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.LOGISTIQUE].label },
  { key: DEPARTMENT_KEYS.ADMINISTRATION, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.ADMINISTRATION].label },
  { key: DEPARTMENT_KEYS.AUDIT, label: DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.AUDIT].label },
] as const;

export function normalizeDepartmentKey(
  departmentKey: string | null | undefined,
): string {
  return String(departmentKey ?? "").trim().toUpperCase();
}

export function getDepartmentNavigationEntry(
  departmentKey: string | null | undefined,
): DepartmentNavigationSpec | null {
  const k = normalizeDepartmentKey(departmentKey);
  if (!(k in DEPARTMENT_NAVIGATION)) return null;
  return DEPARTMENT_NAVIGATION[k as DepartmentKey];
}

export function getDepartmentRoutePrefixes(
  departmentKey: string | null | undefined,
): readonly string[] {
  return getDepartmentNavigationEntry(departmentKey)?.routePrefixes ?? [];
}
