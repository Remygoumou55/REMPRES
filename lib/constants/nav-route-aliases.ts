import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";

/** Alias URL sidebar → routes canoniques ERP. */
export const NAV_ROUTE_ALIASES: Readonly<Record<string, string>> = {
  "/parametres": SETTINGS_OFFICIAL_ROUTES.hub,
  "/parametres/securite": SETTINGS_OFFICIAL_ROUTES.security,
  "/parametres/notifications": SETTINGS_OFFICIAL_ROUTES.notifications,
  "/parametres/systeme": SETTINGS_OFFICIAL_ROUTES.system,
  "/parametres/devise": SETTINGS_OFFICIAL_ROUTES.currency,
  "/parametres/permissions": SETTINGS_OFFICIAL_ROUTES.permissions,
  "/parametres/taux": SETTINGS_OFFICIAL_ROUTES.rates,
  "/parametres/langue": SETTINGS_OFFICIAL_ROUTES.language,
  "/actions/approbations": "/admin/approvals",
  "/actions/alertes": "/admin/alerts",
  "/archives/exports": "/admin/exports",
  "/archives/suppressions": "/admin/suppressions",
};

/** Réécritures internes (URL navigateur inchangée). */
export const NAV_ROUTE_REWRITES: Readonly<Record<string, string>> = {};

export function resolveNavRouteAlias(pathname: string): string | null {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized in NAV_ROUTE_ALIASES) {
    return NAV_ROUTE_ALIASES[normalized];
  }
  return null;
}

export function resolveNavRouteRewrite(pathname: string): string | null {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized in NAV_ROUTE_REWRITES) {
    return NAV_ROUTE_REWRITES[normalized];
  }
  return null;
}
