import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Coins,
  Cog,
  Lock,
  Percent,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { findNavItemByKey, NAV_PARAMETRES_HUB_EXTRAS } from "@/lib/constants/nav-config";
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

const CHILD_ICONS: Record<string, LucideIcon> = {
  utilisateurs: Users,
  securite: Shield,
  notifications: Bell,
  systeme: Cog,
};

const HUB_EXTRA_ICONS: Record<string, LucideIcon> = {
  permissions: Settings2,
  devise: Coins,
  taux: Percent,
  langue: Lock,
};

const HUB_EXTRA_IDS: Record<string, SettingsGovernanceNavItem["id"]> = {
  permissions: "permissions",
  devise: "currency",
  taux: "rates",
  langue: "language",
};

const parametresItem = findNavItemByKey("parametres");

export const SETTINGS_GOVERNANCE_NAV: readonly SettingsGovernanceNavItem[] = [
  ...(parametresItem
    ? [{ id: "hub" as const, href: parametresItem.href, label: parametresItem.label, icon: Cog }]
    : []),
  ...(parametresItem?.children ?? []).map((c) => ({
    id: (c.key === "utilisateurs"
      ? "users"
      : c.key === "securite"
        ? "security"
        : c.key === "notifications"
          ? "notifications"
          : "system") as SettingsGovernanceNavItem["id"],
    href: c.href,
    label: c.label,
    icon: CHILD_ICONS[c.key] ?? Cog,
  })),
  ...NAV_PARAMETRES_HUB_EXTRAS.map((e) => ({
    id: HUB_EXTRA_IDS[e.key] ?? "permissions",
    href: e.href,
    label: e.label,
    icon: HUB_EXTRA_ICONS[e.key] ?? Settings2,
    locked: e.key === "langue",
  })),
];

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
