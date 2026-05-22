import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Coins,
  Cog,
  LayoutDashboard,
  Lock,
  Percent,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";
import { isSettingsGovernancePath } from "@/lib/settings/legacy-route-lock";

export type SettingsGovernanceNavItem = {
  id:
    | "hub"
    | "users"
    | "permissions"
    | "security"
    | "currency"
    | "rates"
    | "notifications"
    | "system"
    | "language";
  href: string;
  label: string;
  icon: LucideIcon;
  locked?: boolean;
};

/** Structure officielle module Paramètres — URLs canoniques uniquement. */
export const SETTINGS_GOVERNANCE_NAV: readonly SettingsGovernanceNavItem[] = [
  { id: "hub", href: SETTINGS_OFFICIAL_ROUTES.hub, label: NAV_LABELS.settingsOverview, icon: LayoutDashboard },
  { id: "users", href: SETTINGS_OFFICIAL_ROUTES.users, label: "Utilisateurs", icon: Users },
  { id: "permissions", href: SETTINGS_OFFICIAL_ROUTES.permissions, label: "Permissions", icon: Settings2 },
  { id: "security", href: SETTINGS_OFFICIAL_ROUTES.security, label: "Sécurité", icon: Shield },
  { id: "currency", href: SETTINGS_OFFICIAL_ROUTES.currency, label: "Devise", icon: Coins },
  { id: "rates", href: SETTINGS_OFFICIAL_ROUTES.rates, label: "Taux", icon: Percent },
  { id: "notifications", href: SETTINGS_OFFICIAL_ROUTES.notifications, label: "Notifications", icon: Bell },
  { id: "system", href: SETTINGS_OFFICIAL_ROUTES.system, label: "Système", icon: Cog },
  { id: "language", href: SETTINGS_OFFICIAL_ROUTES.language, label: "Langue", icon: Lock, locked: true },
] as const;

export { isSettingsGovernancePath };

export function settingsNavActiveId(pathname: string): SettingsGovernanceNavItem["id"] {
  if (pathname === SETTINGS_OFFICIAL_ROUTES.hub) return "hub";
  if (pathname.startsWith(SETTINGS_OFFICIAL_ROUTES.users)) return "users";
  if (pathname.startsWith(SETTINGS_OFFICIAL_ROUTES.permissions)) return "permissions";
  if (pathname.startsWith(SETTINGS_OFFICIAL_ROUTES.security)) return "security";
  if (pathname.startsWith(SETTINGS_OFFICIAL_ROUTES.currency)) return "currency";
  if (pathname.startsWith(SETTINGS_OFFICIAL_ROUTES.rates)) return "rates";
  if (pathname.startsWith(SETTINGS_OFFICIAL_ROUTES.notifications)) return "notifications";
  if (pathname.startsWith(SETTINGS_OFFICIAL_ROUTES.system)) return "system";
  if (pathname.startsWith(SETTINGS_OFFICIAL_ROUTES.language)) return "language";
  return "hub";
}
