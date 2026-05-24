import { LEGACY_ROLE_ALIASES, normalizeRoleKey } from "@/lib/auth/roles";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";

export type NavRoles = readonly string[] | "all";

export type NavChildItem = {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
  readonly roles: NavRoles;
  readonly badge?: "pendingCount";
};

export type NavItem = {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly href?: string;
  readonly headerClickable?: false;
  readonly roles: NavRoles;
  readonly expandable: boolean;
  readonly children?: readonly NavChildItem[];
};

export type NavSection = {
  readonly section: string;
  readonly items: readonly NavItem[];
};

export type NavHubExtra = {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
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
        href: "/dashboard",
        roles: "all",
        expandable: false,
      },
      {
        key: "departements",
        label: "Départements",
        icon: "Building2",
        roles: "all",
        expandable: true,
        headerClickable: false,
        children: [
          {
            key: "dept-vente",
            label: "Vente",
            icon: "ShoppingCart",
            href: "/dept/vente",
            roles: ["super_admin", "directeur_general", "responsable_vente", "employe", "comptable", "manager", "agent"],
          },
          {
            key: "dept-finance",
            label: "Finance",
            icon: "BarChart3",
            href: "/dept/finance",
            roles: ["super_admin", "directeur_general", "comptable", "accountant", "manager"],
          },
          {
            key: "dept-rh",
            label: "RH",
            icon: "Users",
            href: "/dept/rh",
            roles: ["super_admin", "directeur_general", "responsable_rh", "manager"],
          },
          {
            key: "dept-formation",
            label: "Formation",
            icon: "GraduationCap",
            href: "/dept/formation",
            roles: ["super_admin", "directeur_general", "responsable_formation", "manager"],
          },
          {
            key: "dept-consultation",
            label: "Consultation",
            icon: "Briefcase",
            href: "/dept/consultation",
            roles: ["super_admin", "directeur_general", "responsable_consultation", "manager"],
          },
          {
            key: "dept-marketing",
            label: "Marketing",
            icon: "Megaphone",
            href: "/dept/marketing",
            roles: ["super_admin", "directeur_general", "responsable_marketing", "manager"],
          },
          {
            key: "dept-logistique",
            label: "Logistique",
            icon: "Package",
            href: "/dept/logistique",
            roles: ["super_admin", "directeur_general", "responsable_logistique", "manager"],
          },
        ],
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
        href: "/actions",
        roles: ["super_admin", "directeur_general", "manager"],
        expandable: true,
        children: [
          {
            key: "approbations",
            label: "Approbations",
            icon: "CheckCircle",
            href: "/actions/approbations",
            roles: ["super_admin", "directeur_general", "manager"],
            badge: "pendingCount",
          },
          {
            key: "alertes",
            label: "Alertes",
            icon: "Bell",
            href: "/actions/alertes",
            roles: ["super_admin", "directeur_general", "manager"],
          },
        ],
      },
      {
        key: "archives",
        label: "Archives",
        icon: "Archive",
        href: "/archives",
        roles: ["super_admin", "directeur_general"],
        expandable: true,
        children: [
          {
            key: "archives-globales",
            label: "Globales",
            icon: "LayoutGrid",
            href: "/archives/globales",
            roles: ["super_admin", "directeur_general"],
          },
          {
            key: "archives-vente",
            label: "Vente",
            icon: "ShoppingCart",
            href: "/archives/vente",
            roles: ["super_admin", "directeur_general"],
          },
          {
            key: "archives-finance",
            label: "Finance",
            icon: "BarChart3",
            href: "/archives/finance",
            roles: ["super_admin", "directeur_general"],
          },
          {
            key: "archives-rh",
            label: "RH",
            icon: "Users",
            href: "/archives/rh",
            roles: ["super_admin", "directeur_general"],
          },
          {
            key: "archives-formation",
            label: "Formation",
            icon: "GraduationCap",
            href: "/archives/formation",
            roles: ["super_admin", "directeur_general"],
          },
          {
            key: "archives-consultation",
            label: "Consultation",
            icon: "Briefcase",
            href: "/archives/consultation",
            roles: ["super_admin", "directeur_general"],
          },
          {
            key: "archives-marketing",
            label: "Marketing",
            icon: "Megaphone",
            href: "/archives/marketing",
            roles: ["super_admin", "directeur_general"],
          },
          {
            key: "archives-logistique",
            label: "Logistique",
            icon: "Package",
            href: "/archives/logistique",
            roles: ["super_admin", "directeur_general"],
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
        expandable: true,
        children: [
          {
            key: "admin-journal",
            label: "Journal d'activité",
            icon: "ClipboardList",
            href: "/admin/activity-logs",
            roles: ["super_admin"],
          },
          {
            key: "admin-utilisateurs",
            label: "Utilisateurs",
            icon: "UserCog",
            href: "/admin/users",
            roles: ["super_admin"],
          },
          {
            key: "admin-exports",
            label: "Exports",
            icon: "Download",
            href: "/admin/exports",
            roles: ["super_admin"],
          },
          {
            key: "admin-suppressions",
            label: "Suppressions",
            icon: "Trash2",
            href: "/admin/suppressions",
            roles: ["super_admin"],
          },
        ],
      },
      {
        key: "parametres",
        label: "Paramètres",
        icon: "Settings",
        roles: ["super_admin"],
        expandable: true,
        headerClickable: false,
        children: [
          {
            key: "param-securite",
            label: "Sécurité",
            icon: "Lock",
            href: "/parametres/securite",
            roles: ["super_admin"],
          },
          {
            key: "param-notifs",
            label: "Notifications",
            icon: "Bell",
            href: "/parametres/notifications",
            roles: ["super_admin"],
          },
          {
            key: "param-systeme",
            label: "Système",
            icon: "Cpu",
            href: "/parametres/systeme",
            roles: ["super_admin"],
          },
          {
            key: "param-devise",
            label: "Devise & Taux",
            icon: "Coins",
            href: "/parametres/devise",
            roles: ["super_admin"],
          },
        ],
      },
    ],
  },
] as const satisfies readonly NavSection[];

export type NavItemKey = string;

/** Hub Actions — entrées hors sidebar. */
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
    description: "Santé plateforme, jobs, observabilité.",
  },
] as const;

/** Hub Archives — entrées hors sidebar. */
export const NAV_ARCHIVES_HUB_EXTRAS: readonly NavHubExtra[] = [
  { key: "archives-ventes", label: "Archives ventes", icon: "ShoppingCart", href: "/vente/clients/archives" },
  { key: "archives-finance", label: "Archives finance", icon: "BarChart3", href: "/admin/audit?department=finance" },
  { key: "archives-rh", label: "Archives RH", icon: "Users", href: "/admin/audit?department=rh" },
  { key: "archives-formation", label: "Archives formation", icon: "GraduationCap", href: "/admin/audit?department=formation" },
  { key: "historique-systeme", label: "Historique système", icon: "Shield", href: "/admin/audit?category=system" },
] as const;

/** Hub Paramètres — cartes hors sidebar (permissions, langue). */
export const NAV_PARAMETRES_HUB_EXTRAS: readonly NavHubExtra[] = [
  {
    key: "permissions",
    label: "Permissions",
    icon: "Settings",
    href: SETTINGS_OFFICIAL_ROUTES.permissions,
    description: "Rôles officiels ERP — un département, un rôle principal.",
  },
  {
    key: "langue",
    label: "Langue",
    icon: "Lock",
    href: SETTINGS_OFFICIAL_ROUTES.language,
    description: "Français actif — autres langues verrouillées (gouvernance).",
  },
] as const;

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

export function getAllNavItems(): Array<NavItem | NavChildItem> {
  const out: Array<NavItem | NavChildItem> = [];
  for (const section of NAV_CONFIG) {
    for (const item of section.items) {
      out.push(item as NavItem);
      if (item.expandable && item.children) {
        for (const child of item.children) {
          out.push(child as NavChildItem);
        }
      }
    }
  }
  return out;
}

export function findNavItemByKey(key: string): NavItem | undefined {
  for (const section of NAV_CONFIG) {
    const item = section.items.find((i) => i.key === key);
    if (item) return item as NavItem;
  }
  return undefined;
}

export function getNavExpandableKeys(): string[] {
  return NAV_CONFIG.flatMap((s) => s.items.filter((i) => i.expandable).map((i) => i.key));
}

function filterNavItem(item: NavItem, userRole: string): NavItem | null {
  if (!canSeeItem(item.roles, userRole)) return null;
  if (!item.expandable || !item.children) return item as NavItem;
  const children = item.children.filter((c) => canSeeItem(c.roles, userRole));
  if (children.length === 0) return null;
  return { ...item, children } as NavItem;
}

export function filterNavConfig(userRole: string): NavSection[] {
  const result: NavSection[] = [];
  for (const section of NAV_CONFIG) {
    const items = section.items
      .map((item) => filterNavItem(item as NavItem, userRole))
      .filter((item): item is NavItem => item !== null);
    if (items.length > 0) {
      result.push({ section: section.section, items });
    }
  }
  return result;
}

export function sectionHasVisibleItems(section: NavSection, userRole: string): boolean {
  return section.items.some((item) => {
    if (!canSeeItem(item.roles, userRole)) return false;
    if (item.expandable && item.children) {
      return item.children.some((c) => canSeeItem(c.roles, userRole));
    }
    return true;
  });
}
