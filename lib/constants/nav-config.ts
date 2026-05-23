import { LEGACY_ROLE_ALIASES, normalizeRoleKey, ROLE_KEYS } from "@/lib/auth/roles";
import type { ShellRailVisibility } from "@/lib/navigation/shell-visibility";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";
import { ROUTES } from "@/lib/constants/routes";

export type NavRoles = readonly string[] | "all";

export type NavChildItem = {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
};

export type NavItem = {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
  readonly roles: NavRoles;
  readonly expandable: boolean;
  readonly children?: readonly NavChildItem[];
};

export type NavSection = {
  readonly section: string;
  readonly items: readonly NavItem[];
};

/** Liens hub uniquement (absents du rail sidebar). */
export type NavHubExtra = NavChildItem & {
  readonly description?: string;
};

export const NAV_CONFIG = [
  {
    section: "Principal",
    items: [
      {
        key: "accueil",
        label: "Accueil",
        icon: "LayoutDashboard",
        href: ROUTES.home,
        roles: "all",
        expandable: false,
      },
      {
        key: "dept",
        label: "Départements",
        icon: "Building2",
        href: ROUTES.dept,
        roles: "all",
        expandable: false,
      },
    ],
  },
  {
    section: "Métier",
    items: [
      {
        key: "vente",
        label: "Vente",
        icon: "ShoppingCart",
        href: "/vente",
        roles: ["super_admin", "directeur_general", "responsable_vente", "employe", "manager", "agent"],
        expandable: false,
      },
      {
        key: "finance",
        label: "Finance",
        icon: "BarChart3",
        href: ROUTES.finance,
        roles: ["super_admin", "directeur_general", "comptable", "accountant", "manager"],
        expandable: false,
      },
      {
        key: "rh",
        label: "RH",
        icon: "Users",
        href: ROUTES.rh,
        roles: ["super_admin", "directeur_general", "responsable_rh", "manager"],
        expandable: false,
      },
      {
        key: "formation",
        label: "Formation",
        icon: "GraduationCap",
        href: "/formation",
        roles: ["super_admin", "directeur_general", "responsable_formation", "manager"],
        expandable: false,
      },
      {
        key: "consultation",
        label: "Consultation",
        icon: "Briefcase",
        href: "/consultation",
        roles: ["super_admin", "directeur_general", "responsable_consultation", "manager"],
        expandable: false,
      },
      {
        key: "marketing",
        label: "Marketing",
        icon: "Megaphone",
        href: "/marketing",
        roles: ["super_admin", "directeur_general", "responsable_marketing", "manager"],
        expandable: false,
      },
      {
        key: "logistique",
        label: "Logistique",
        icon: "Package",
        href: ROUTES.logistics,
        roles: ["super_admin", "directeur_general", "responsable_logistique", "manager"],
        expandable: false,
      },
    ],
  },
  {
    section: "Opérations",
    items: [
      {
        key: "actions",
        label: "Actions",
        icon: "Zap",
        href: ROUTES.actions,
        roles: ["super_admin", "directeur_general", "manager"],
        expandable: true,
        children: [
          {
            key: "approbations",
            label: "Approbations",
            icon: "CheckCircle",
            href: "/admin/approvals",
          },
          { key: "alertes", label: "Alertes", icon: "Bell", href: "/admin/alerts" },
          {
            key: "journaux",
            label: "Journaux",
            icon: "ClipboardList",
            href: "/admin/activity-logs",
          },
        ],
      },
      {
        key: "archives",
        label: "Archives",
        icon: "Archive",
        href: ROUTES.archives,
        roles: ["super_admin", "directeur_general"],
        expandable: true,
        children: [
          {
            key: "archives-globales",
            label: "Globales",
            icon: "FolderArchive",
            href: ROUTES.archives,
          },
          {
            key: "archives-exports",
            label: "Exports",
            icon: "Download",
            href: "/admin/activity-logs/export",
          },
          {
            key: "archives-suppressions",
            label: "Suppressions",
            icon: "Trash2",
            href: "/admin/activity-logs?actionKey=delete",
          },
        ],
      },
    ],
  },
  {
    section: "Administration",
    items: [
      {
        key: "admin",
        label: "Admin",
        icon: "Shield",
        href: "/admin",
        roles: ["super_admin"],
        expandable: false,
      },
      {
        key: "parametres",
        label: "Paramètres",
        icon: "Settings",
        href: SETTINGS_OFFICIAL_ROUTES.hub,
        roles: ["super_admin"],
        expandable: true,
        children: [
          {
            key: "utilisateurs",
            label: "Utilisateurs",
            icon: "UserCog",
            href: SETTINGS_OFFICIAL_ROUTES.users,
          },
          {
            key: "securite",
            label: "Sécurité",
            icon: "Lock",
            href: SETTINGS_OFFICIAL_ROUTES.security,
          },
          {
            key: "notifications",
            label: "Notifications",
            icon: "Bell",
            href: SETTINGS_OFFICIAL_ROUTES.notifications,
          },
          {
            key: "systeme",
            label: "Système",
            icon: "Cpu",
            href: SETTINGS_OFFICIAL_ROUTES.system,
          },
        ],
      },
    ],
  },
] as const satisfies readonly NavSection[];

export type NavItemKey = string;

/** Entrées hub Actions (hors sidebar). */
export const NAV_ACTIONS_HUB_EXTRAS: readonly NavHubExtra[] = [
  {
    key: "audit",
    label: "Audit entreprise",
    icon: "Shield",
    href: "/admin/audit",
    description: "Traçabilité métier sensible — immuable, filtrable, exportable.",
  },
  {
    key: "system",
    label: "Activité système",
    icon: "Cpu",
    href: "/admin/platform-dashboard",
    description: "Santé plateforme, jobs, observabilité — sans logs développeur bruts.",
  },
] as const;

/** Entrées hub Archives (hors sidebar). */
export const NAV_ARCHIVES_HUB_EXTRAS: readonly NavHubExtra[] = [
  {
    key: "archives-ventes",
    label: "Archives ventes",
    icon: "ShoppingCart",
    href: "/vente/clients/archives",
  },
  {
    key: "archives-finance",
    label: "Archives finance",
    icon: "BarChart3",
    href: "/admin/audit?department=finance",
  },
  {
    key: "archives-rh",
    label: "Archives RH",
    icon: "Users",
    href: "/admin/audit?department=rh",
  },
  {
    key: "archives-formation",
    label: "Archives formation",
    icon: "GraduationCap",
    href: "/admin/audit?department=formation",
  },
  {
    key: "historique-systeme",
    label: "Historique système",
    icon: "Shield",
    href: "/admin/audit?category=system",
  },
] as const;

/** Cartes hub Paramètres (hors sidebar). */
export const NAV_PARAMETRES_HUB_EXTRAS: readonly NavHubExtra[] = [
  {
    key: "permissions",
    label: "Permissions",
    icon: "Settings",
    href: SETTINGS_OFFICIAL_ROUTES.permissions,
    description: "Rôles officiels ERP — un département, un rôle principal.",
  },
  {
    key: "devise",
    label: "Devise",
    icon: "BarChart3",
    href: SETTINGS_OFFICIAL_ROUTES.currency,
    description: "Devise de référence et affichage multi-devises.",
  },
  {
    key: "taux",
    label: "Taux",
    icon: "BarChart3",
    href: SETTINGS_OFFICIAL_ROUTES.rates,
    description: "Taux de change et conversions.",
  },
  {
    key: "langue",
    label: "Langue",
    icon: "Settings",
    href: SETTINGS_OFFICIAL_ROUTES.language,
    description: "Français actif — autres langues verrouillées (gouvernance).",
  },
] as const;

const METIER_SHELL_KEYS: Record<string, keyof ShellRailVisibility> = {
  vente: "commerce",
  finance: "finance",
  rh: "rh",
  formation: "formation",
  consultation: "formation",
  marketing: "marketing",
  logistique: "logistics",
};

function roleMatchesAllowed(allowed: readonly string[], userRole: string): boolean {
  const u = normalizeRoleKey(userRole);
  if (!u) return false;

  for (const r of allowed) {
    const rn = normalizeRoleKey(r);
    if (rn === u) return true;
    const legacy = LEGACY_ROLE_ALIASES[rn];
    if (legacy && legacy === u) return true;
    const userLegacy = LEGACY_ROLE_ALIASES[u];
    if (userLegacy && userLegacy === rn) return true;
  }
  return false;
}

export function canSeeItem(roles: NavRoles, userRole: string): boolean {
  if (roles === "all") return true;
  return roleMatchesAllowed(roles as readonly string[], userRole);
}

export function canSeeNavItem(
  item: NavItem,
  userRole: string,
  opts: { isSuperAdmin: boolean; shellRail: ShellRailVisibility },
): boolean {
  if (!canSeeItem(item.roles, userRole)) return false;

  if (opts.isSuperAdmin) {
    if (item.key === "actions" || item.key === "archives" || item.key === "parametres" || item.key === "admin") {
      return true;
    }
    if (item.key in METIER_SHELL_KEYS) return true;
    if (item.key === "dept") return true;
    return item.key === "accueil";
  }

  if (item.key === "admin" || item.key === "parametres") return false;
  if (item.key === "actions") return opts.shellRail.actions;
  if (item.key === "archives") return false;
  if (item.key === "dept") return false;

  const shellKey = METIER_SHELL_KEYS[item.key];
  if (shellKey) {
    const rail = opts.shellRail[shellKey];
    if (item.key === "vente" && !rail) {
      return opts.shellRail.crm;
    }
    return Boolean(rail);
  }

  return true;
}

export function filterNavConfig(
  userRole: string,
  opts: { isSuperAdmin: boolean; shellRail: ShellRailVisibility },
): NavSection[] {
  return NAV_CONFIG.map((section) => ({
    section: section.section,
    items: section.items.filter((item) => canSeeNavItem(item, userRole, opts)),
  })).filter((section) => section.items.length > 0);
}

export function getNavExpandableKeys(): string[] {
  return NAV_CONFIG.flatMap((s) => s.items.filter((i) => i.expandable).map((i) => i.key));
}

export function isSuperAdminRole(userRole: string): boolean {
  return normalizeRoleKey(userRole) === ROLE_KEYS.SUPER_ADMIN;
}

export function findNavItemByKey(key: string): NavItem | undefined {
  for (const section of NAV_CONFIG) {
    const item = section.items.find((i) => i.key === key);
    if (item) return item as NavItem;
  }
  return undefined;
}
