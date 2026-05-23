import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CheckSquare,
  ClipboardList,
  LineChart,
  Shield,
  Zap,
} from "lucide-react";
import { findNavItemByKey, NAV_ACTIONS_HUB_EXTRAS } from "@/lib/constants/nav-config";
import { ROUTES } from "@/lib/constants/routes";

export type GovernanceActionsNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  id: "hub" | "approvals" | "alerts" | "audit" | "journals" | "system";
};

const HUB_EXTRA_ICONS: Record<string, LucideIcon> = {
  audit: Shield,
  system: LineChart,
};

const SIDEBAR_CHILD_ICONS: Record<string, LucideIcon> = {
  approbations: CheckSquare,
  alertes: Bell,
  journaux: ClipboardList,
};

const actionsItem = findNavItemByKey("actions");

/**
 * Structure officielle du module Actions — dérivée de NAV_CONFIG (sidebar + hub).
 */
export const GOVERNANCE_ACTIONS_NAV: readonly GovernanceActionsNavItem[] = [
  ...(actionsItem
    ? [
        {
          id: "hub" as const,
          href: actionsItem.href ?? ROUTES.actions,
          label: actionsItem.label,
          icon: Zap,
        },
      ]
    : []),
  ...(actionsItem?.children ?? []).map((c) => ({
    id: (c.key === "approbations"
      ? "approvals"
      : c.key === "alertes"
        ? "alerts"
        : "journals") as GovernanceActionsNavItem["id"],
    href: c.href,
    label: c.label,
    icon: SIDEBAR_CHILD_ICONS[c.key] ?? CheckSquare,
  })),
  ...NAV_ACTIONS_HUB_EXTRAS.map((e) => ({
    id: (e.key === "audit" ? "audit" : "system") as GovernanceActionsNavItem["id"],
    href: e.href,
    label: e.label,
    icon: HUB_EXTRA_ICONS[e.key] ?? Shield,
  })),
];

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
  if (pathname === "/actions/journaux" || pathname.startsWith("/actions/journaux/")) return true;
  if (pathname === "/admin/platform-dashboard") return true;
  if (pathname === "/admin/intelligence" || pathname.startsWith("/admin/intelligence/")) return true;
  return false;
}

export function governanceNavActiveId(pathname: string): GovernanceActionsNavItem["id"] {
  if (pathname === ROUTES.actions || pathname.startsWith(`${ROUTES.actions}/`)) return "hub";
  if (pathname.startsWith("/admin/approvals")) return "approvals";
  if (pathname.startsWith("/admin/alerts")) return "alerts";
  if (pathname.startsWith("/admin/audit")) return "audit";
  if (pathname === "/actions/journaux" || pathname.startsWith("/actions/journaux/")) return "journals";
  if (pathname === "/admin/platform-dashboard") return "system";
  if (pathname === "/admin/intelligence" || pathname.startsWith("/admin/intelligence/")) return "system";
  return "hub";
}
