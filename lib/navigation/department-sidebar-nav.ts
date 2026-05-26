/**
 * Construction navigation rail métier (M3) — groupes repliables, sans sidebar secondaire.
 */
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Calendar,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Package,
  Receipt,
  Settings2,
  ShoppingCart,
  Truck,
  UserCircle,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { DEPARTMENT_KEYS, type DepartmentKey } from "@/lib/departments/department-config";
import { VENTE_DOMAIN_LABEL } from "@/lib/navigation/vente-rail-lock";
import {
  OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE,
  type SidebarNavGroupSpec,
} from "@/lib/navigation/erp-ux-architecture";
import { CRM_NAV } from "@/modules/crm/constants/nav";
import { LOGISTICS_NAV } from "@/modules/logistics/constants/nav";
import type { CollapsibleNavLinkItem } from "@/components/layout/app-shell/CollapsibleNavGroup";
import { resolveEffectiveDepartmentKey } from "@/lib/auth/profile-authority";
import type { ShellRailVisibility } from "@/lib/navigation/shell-visibility";

const FORMATION_LINK_ICONS: Record<string, LucideIcon> = {
  "/formation/dashboard": LayoutDashboard,
  "/formation/formations": BookOpen,
  "/formation/apprenants": UserCircle,
  "/formation/inscriptions": ClipboardList,
  "/formation/certificats": Award,
};

const CONSULTATION_LINK_ICONS: Record<string, LucideIcon> = {
  "/consultation/missions": Briefcase,
  "/consultation/agenda": Calendar,
  "/consultation/clients": Users,
};

const ICON_BY_HREF_PREFIX: { prefix: string; icon: LucideIcon }[] = [
  { prefix: "/vente/crm", icon: Briefcase },
  { prefix: "/vente/clients", icon: Users },
  { prefix: "/vente/produits", icon: Package },
  { prefix: "/vente/nouvelle-vente", icon: ShoppingCart },
  { prefix: "/vente/historique", icon: ClipboardList },
  { prefix: "/vente/statistiques", icon: BarChart3 },
  { prefix: "/finance/depenses", icon: Receipt },
  { prefix: "/finance", icon: BarChart3 },
  { prefix: "/rh", icon: Users },
  { prefix: "/formation", icon: GraduationCap },
  { prefix: "/consultation", icon: Briefcase },
  { prefix: "/marketing", icon: Megaphone },
  { prefix: "/logistique", icon: Truck },
  { prefix: ROUTES.actions, icon: Zap },
  { prefix: ROUTES.settings, icon: Settings2 },
];

function iconForHref(href: string): LucideIcon {
  const exact =
    FORMATION_LINK_ICONS[href] ??
    CONSULTATION_LINK_ICONS[href];
  if (exact) return exact;
  const match = ICON_BY_HREF_PREFIX.find((e) => href === e.prefix || href.startsWith(`${e.prefix}/`));
  return match?.icon ?? LayoutDashboard;
}

function crmLinksFromNav(): CollapsibleNavLinkItem[] {
  return CRM_NAV.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
  }));
}

function logisticsLinksFromNav(): CollapsibleNavLinkItem[] {
  return LOGISTICS_NAV.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
  }));
}

/** Enrichit les specs M3 avec icônes (CRM / logistique = sources existantes). */
function enrichGroupLinks(group: SidebarNavGroupSpec): CollapsibleNavLinkItem[] {
  if (group.id === "crm") return crmLinksFromNav();
  if (group.id === "logistique") return logisticsLinksFromNav();
  return group.links.map((link) => ({
    href: link.href,
    label: link.label,
    icon: iconForHref(link.href),
  }));
}

export type DepartmentSidebarGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  links: CollapsibleNavLinkItem[];
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  commerce: ShoppingCart,
  crm: Briefcase,
  finance: Wallet,
  rh: Users,
  formation: GraduationCap,
  consultation: Briefcase,
  accueil: LayoutDashboard,
  marketing: Megaphone,
  logistique: Truck,
  actions: Zap,
  settings: Settings2,
};

export function buildDepartmentSidebarGroups(
  departmentKey: string | null | undefined,
  options?: {
    includeActions?: boolean;
    includeSettings?: boolean;
  },
): DepartmentSidebarGroup[] {
  const effective = resolveEffectiveDepartmentKey(departmentKey);
  if (!effective) return [];

  const arch = OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE[effective];
  if (!arch) return [];

  const groups: DepartmentSidebarGroup[] = arch.navGroups.map((g) => ({
    id: g.id,
    label: g.label,
    icon: GROUP_ICONS[g.id] ?? LayoutDashboard,
    links: enrichGroupLinks(g),
  }));

  if (options?.includeActions) {
    groups.push({
      id: "actions",
      label: NAV_LABELS.actions,
      icon: Zap,
      links: [{ href: ROUTES.actions, label: NAV_LABELS.actionsOverview, icon: Zap }],
    });
  }

  if (options?.includeSettings) {
    groups.push({
      id: "settings",
      label: NAV_LABELS.settings,
      icon: Settings2,
      links: [{ href: ROUTES.settings, label: NAV_LABELS.settingsOverview, icon: Settings2 }],
    });
  }

  return groups;
}

/** Verrouillage visibilité — aucun groupe hors shellRail ne doit être rendu. */
export function lockDepartmentSidebarGroups(
  groups: DepartmentSidebarGroup[],
  shellRail: ShellRailVisibility,
  canReadClients: boolean,
  canReadProducts: boolean,
): DepartmentSidebarGroup[] {
  return filterDepartmentSidebarGroups(groups, shellRail, canReadClients, canReadProducts);
}

/** Filtre groupes selon visibilité rail M2.5 (partagé desktop + mobile). */
export function filterDepartmentSidebarGroups(
  groups: DepartmentSidebarGroup[],
  shellRail: ShellRailVisibility,
  canReadClients: boolean,
  canReadProducts: boolean,
): DepartmentSidebarGroup[] {
  const visible = (id: string) => {
    if (id === "commerce") return shellRail.commerce;
    if (id === "crm") return shellRail.crm;
    if (id === "finance") return shellRail.finance;
    if (id === "rh") return shellRail.rh;
    if (id === "logistique") return shellRail.logistics;
    if (id === "formation") return shellRail.formation;
    if (id === "consultation") return shellRail.formation;
    if (id === "marketing") return shellRail.marketing;
    if (id === "actions") return shellRail.actions;
    if (id === "settings") return shellRail.settings;
    return true;
  };

  return groups
    .filter((g) => visible(g.id))
    .map((g) => {
      if (g.id !== "commerce") return g;
      return {
        ...g,
        links: g.links.filter((link) => {
          if (link.href.includes("/clients")) return canReadClients;
          return canReadProducts;
        }),
      };
    })
    .filter((g) => g.links.length > 0 || g.id === "actions" || g.id === "settings");
}

/** Libellé contexte header depuis le chemin. */
export function resolveDepartmentNavContextLabel(
  pathname: string,
  departmentKey: string | null | undefined,
): string {
  const effective = resolveEffectiveDepartmentKey(departmentKey);
  if (!effective) return "";
  const base = DEPARTMENT_NAVIGATION_LABEL[effective] ?? effective;
  if (pathname.includes("/dashboard")) return `${base} — Accueil`;
  if (pathname.startsWith("/vente/crm")) return `${base} — CRM`;
  if (pathname.startsWith(ROUTES.actions) || pathname.startsWith("/admin")) return NAV_LABELS.actions;
  if (pathname.startsWith(ROUTES.settings)) return NAV_LABELS.settings;
  return base;
}

const DEPARTMENT_NAVIGATION_LABEL: Partial<Record<DepartmentKey, string>> = {
  [DEPARTMENT_KEYS.VENTE]: VENTE_DOMAIN_LABEL,
  [DEPARTMENT_KEYS.FINANCE]: "Finance",
  [DEPARTMENT_KEYS.RH]: NAV_LABELS.rh,
  [DEPARTMENT_KEYS.FORMATION]: NAV_LABELS.formation,
  [DEPARTMENT_KEYS.MARKETING]: NAV_LABELS.marketing,
  [DEPARTMENT_KEYS.LOGISTIQUE]: NAV_LABELS.logistics,
};

/** Libellé de section sidebar (évite de répéter le 1er groupe). */
export function getDepartmentSectionLabel(departmentKey: string | null | undefined): string | null {
  const effective = resolveEffectiveDepartmentKey(departmentKey);
  if (!effective) return null;
  return DEPARTMENT_NAVIGATION_LABEL[effective] ?? null;
}
