import type { LucideIcon } from "lucide-react";
import { Archive, Settings2, Zap } from "lucide-react";
import { findNavItemByKey } from "@/lib/constants/nav-config";
import { ARCHIVES_GOVERNANCE_NAV, isArchivesGovernancePath } from "@/lib/archives/governance-nav";
import { GOVERNANCE_ACTIONS_NAV } from "@/lib/actions/governance-nav";
import { SETTINGS_GOVERNANCE_NAV } from "@/lib/settings/governance-nav";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";
import { isSettingsGovernancePath } from "@/lib/settings/legacy-route-lock";
import { ROUTES } from "@/lib/constants/routes";

/** Segments collapsibles du rail (hors Accueil). */
export const SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS = ["actions", "archives", "admin"] as const;

export type SuperAdminNavSegment = (typeof SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS)[number] | "unmapped";

export type SuperAdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type SuperAdminNavGroupDef = {
  id: Exclude<SuperAdminNavSegment, "unmapped">;
  label: string;
  icon: LucideIcon;
  links: SuperAdminNavLink[];
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  actions: Zap,
  archives: Archive,
  admin: Settings2,
};

function sidebarChildrenFromNav(key: string): SuperAdminNavLink[] {
  const item = findNavItemByKey(key);
  if (!item?.expandable || !item.children) return [];
  return item.children.map((c) => ({
    href: c.href,
    label: c.label,
    icon: Zap,
  }));
}

/**
 * Groupes dérivés de NAV_CONFIG (sidebar uniquement — sans hub extras).
 * OWNERSHIP : source unique = nav-config.ts ; ce module = validation lockdown SA (pas de rendu parallèle).
 */
export const SUPER_ADMIN_NAV_GROUPS: SuperAdminNavGroupDef[] = SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS.map(
  (id) => {
    const navItem = findNavItemByKey(id);
    return {
      id,
      label: navItem?.label ?? id,
      icon: GROUP_ICONS[id] ?? Zap,
      links: sidebarChildrenFromNav(id),
    };
  },
);

const ACTIONS_PREFIXES = [
  ROUTES.actions,
  "/admin/approvals",
  "/admin/alerts",
  "/admin/audit",
  "/admin/activity-logs",
  "/admin/activity-logs/export",
  "/admin/platform-dashboard",
  "/admin/intelligence",
  "/admin/global-dashboard",
] as const;

const ARCHIVES_PREFIXES = [
  ROUTES.archives,
  "/admin/archives",
  "/vente/clients/archives",
  "/vente/produits/archives",
  ROUTES.history,
  "/vente/recu",
  "/admin/activity-logs/export",
  "/admin/activity-logs/export-json",
] as const;

const SETTINGS_PREFIXES = [SETTINGS_OFFICIAL_ROUTES.hub] as const;

function matchesPrefixes(pathname: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export type SuperAdminNavHighlight = "dashboard" | SuperAdminNavSegment | "departements" | "unmapped";

export function getSuperAdminNavSegment(
  pathname: string,
  search: Pick<URLSearchParams, "get"> | null = null,
): SuperAdminNavHighlight {
  if (pathname === ROUTES.home || pathname.startsWith(`${ROUTES.home}/`)) return "dashboard";
  if (matchesPrefixes(pathname, SETTINGS_PREFIXES) || isSettingsGovernancePath(pathname)) return "admin";

  const archivesMatch = search ? isArchivesGovernancePath(pathname, search) : matchesPrefixes(pathname, ARCHIVES_PREFIXES);
  if (archivesMatch) return "archives";

  if (matchesPrefixes(pathname, ACTIONS_PREFIXES)) return "actions";
  if (pathname.startsWith("/dept")) return "departements";
  if (pathname.startsWith("/admin")) return "unmapped";
  return "unmapped";
}

export const SUPER_ADMIN_HEADER_LABELS: Record<SuperAdminNavHighlight, string> = {
  dashboard: "Accueil",
  actions: "Actions",
  archives: "Archives",
  admin: "Admin",
  departements: "Départements",
  unmapped: "Vue hors menu supervision",
};

/** @deprecated Utiliser NAV_CONFIG — conservé pour tests de lockdown. */
export const SUPER_ADMIN_NAV_GOVERNANCE_SOURCES = {
  actions: GOVERNANCE_ACTIONS_NAV,
  archives: ARCHIVES_GOVERNANCE_NAV,
  settings: SETTINGS_GOVERNANCE_NAV,
} as const;
