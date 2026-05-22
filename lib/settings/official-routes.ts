/**
 * Routes officielles module Paramètres — source unique ERP.
 * Toute autre URL configuration doit rediriger ici.
 */
export const SETTINGS_OFFICIAL_ROUTES = {
  hub: "/settings",
  users: "/settings/users",
  permissions: "/settings/permissions",
  security: "/settings/security",
  currency: "/settings/currency",
  rates: "/settings/rates",
  notifications: "/settings/notifications",
  system: "/settings/system",
  language: "/settings/language",
} as const;

export type SettingsOfficialRouteKey = keyof typeof SETTINGS_OFFICIAL_ROUTES;

/** Alias historiques → route officielle (redirection 308). */
export const SETTINGS_LEGACY_ALIAS_REDIRECTS: Readonly<Record<string, string>> = {
  "/config": SETTINGS_OFFICIAL_ROUTES.permissions,
  "/admin": SETTINGS_OFFICIAL_ROUTES.hub,
  "/admin/users": SETTINGS_OFFICIAL_ROUTES.users,
  "/admin/currency": SETTINGS_OFFICIAL_ROUTES.rates,
};

export function isSettingsOfficialPath(pathname: string): boolean {
  if (pathname === SETTINGS_OFFICIAL_ROUTES.hub) return true;
  return Object.values(SETTINGS_OFFICIAL_ROUTES).some(
    (p) => p !== SETTINGS_OFFICIAL_ROUTES.hub && (pathname === p || pathname.startsWith(`${p}/`)),
  );
}
