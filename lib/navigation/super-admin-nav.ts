import type { LucideIcon } from "lucide-react";
import { Zap, Archive, Settings2 } from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { ARCHIVES_GOVERNANCE_NAV, isArchivesGovernancePath } from "@/lib/archives/governance-nav";
import { GOVERNANCE_ACTIONS_NAV } from "@/lib/actions/governance-nav";
import { SETTINGS_GOVERNANCE_NAV } from "@/lib/settings/governance-nav";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";
import { isSettingsGovernancePath } from "@/lib/settings/legacy-route-lock";

/** Segments collapsibles du rail (hors Accueil). */
export const SUPER_ADMIN_OFFICIAL_RAIL_GROUP_IDS = ["actions", "archives", "settings"] as const;

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

/**
 * Navigation super_admin : gouvernance + archives **lecture / traçabilité** uniquement (pas de vues analytiques métiers actives).
 */
export const SUPER_ADMIN_NAV_GROUPS: SuperAdminNavGroupDef[] = [
  {
    id: "actions",
    label: "Actions",
    icon: Zap,
    links: GOVERNANCE_ACTIONS_NAV.map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon,
    })),
  },
  {
    id: "archives",
    label: "Archives",
    icon: Archive,
    links: ARCHIVES_GOVERNANCE_NAV.map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon,
    })),
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: Settings2,
    links: SETTINGS_GOVERNANCE_NAV.map((item) => ({
      href: item.href,
      label: item.locked ? `${item.label} 🔒` : item.label,
      icon: item.icon,
    })),
  },
];

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

/** Archives = hub figé, corbeilles admin, archives vente, historique lecture, exports, audit. */
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

export type SuperAdminNavHighlight = "dashboard" | SuperAdminNavSegment;

/**
 * Segment actif pour surbrillance rail + libellé header (honnête : pas de faux regroupement « Actions »).
 * @param search — si fourni (client), les vues audit filtrées et le journal des suppressions basculent sous le segment Archives.
 */
export function getSuperAdminNavSegment(
  pathname: string,
  search: Pick<URLSearchParams, "get"> | null = null,
): SuperAdminNavHighlight {
  if (pathname === ROUTES.home || pathname.startsWith(`${ROUTES.home}/`)) return "dashboard";
  if (matchesPrefixes(pathname, SETTINGS_PREFIXES) || isSettingsGovernancePath(pathname)) return "settings";

  const archivesMatch = search ? isArchivesGovernancePath(pathname, search) : matchesPrefixes(pathname, ARCHIVES_PREFIXES);
  if (archivesMatch) return "archives";

  if (matchesPrefixes(pathname, ACTIONS_PREFIXES)) return "actions";
  if (pathname.startsWith("/admin")) return "unmapped";
  if (pathname.startsWith("/dept")) return "unmapped";
  return "unmapped";
}

/** Libellé header super_admin (aucun libellé trompeur). */
export const SUPER_ADMIN_HEADER_LABELS: Record<SuperAdminNavHighlight, string> = {
  dashboard: "Accueil",
  actions: "Actions",
  archives: "Archives",
  settings: "Paramètres",
  unmapped: "Vue hors menu supervision",
};
