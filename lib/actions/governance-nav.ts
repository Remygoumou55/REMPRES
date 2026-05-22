import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  Shield,
} from "lucide-react";
import { ROUTES } from "@/lib/constants/routes";
import { NAV_LABELS } from "@/lib/constants/nav-labels";

export type GovernanceActionsNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Segment clé pour surbrillance */
  id: "hub" | "approvals" | "alerts" | "audit" | "journals" | "system";
};

/**
 * Structure officielle du module Actions (supervision / gouvernance).
 * Les URLs canoniques restent sous `/actions` (hub) et `/admin/*` (centres).
 */
export const GOVERNANCE_ACTIONS_NAV: readonly GovernanceActionsNavItem[] = [
  { id: "hub", href: ROUTES.actions, label: NAV_LABELS.actionsOverview, icon: LayoutDashboard },
  { id: "approvals", href: "/admin/approvals", label: "Approbations", icon: CheckSquare },
  { id: "alerts", href: "/admin/alerts", label: "Alertes", icon: Bell },
  { id: "audit", href: "/admin/audit", label: "Audit", icon: Shield },
  { id: "journals", href: "/admin/activity-logs", label: "Journaux", icon: ClipboardList },
  { id: "system", href: "/admin/platform-dashboard", label: "Activité système", icon: LineChart },
] as const;

import { isSettingsOfficialPath, SETTINGS_LEGACY_ALIAS_REDIRECTS } from "@/lib/settings/official-routes";

function isLegacySettingsAliasPath(pathname: string): boolean {
  if (pathname in SETTINGS_LEGACY_ALIAS_REDIRECTS) return true;
  if (pathname.startsWith("/config/")) return true;
  if (pathname === "/admin/users" || pathname.startsWith("/admin/users/")) return true;
  if (pathname === "/admin/currency" || pathname.startsWith("/admin/currency/")) return true;
  return false;
}

export function isGovernanceActionsPath(pathname: string): boolean {
  if (isSettingsOfficialPath(pathname) || isLegacySettingsAliasPath(pathname)) return false;
  if (pathname.startsWith("/admin/activity-logs/export")) return false;
  if (pathname === ROUTES.actions || pathname.startsWith(`${ROUTES.actions}/`)) return true;
  if (pathname.startsWith("/admin/approvals")) return true;
  if (pathname.startsWith("/admin/alerts")) return true;
  if (pathname.startsWith("/admin/audit")) return true;
  if (pathname.startsWith("/admin/activity-logs")) return true;
  if (pathname === "/admin/platform-dashboard") return true;
  if (pathname === "/admin/intelligence" || pathname.startsWith("/admin/intelligence/")) return true;
  return false;
}

export function governanceNavActiveId(pathname: string): GovernanceActionsNavItem["id"] {
  if (pathname === ROUTES.actions || pathname.startsWith(`${ROUTES.actions}/`)) return "hub";
  if (pathname.startsWith("/admin/approvals")) return "approvals";
  if (pathname.startsWith("/admin/alerts")) return "alerts";
  if (pathname.startsWith("/admin/audit")) return "audit";
  if (pathname.startsWith("/admin/activity-logs")) return "journals";
  if (pathname === "/admin/platform-dashboard") return "system";
  if (pathname === "/admin/intelligence" || pathname.startsWith("/admin/intelligence/")) return "system";
  return "hub";
}
