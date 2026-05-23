import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";

/** Alias URL sidebar → routes canoniques ERP. */
export const NAV_ROUTE_ALIASES: Readonly<Record<string, string>> = {
  "/parametres": SETTINGS_OFFICIAL_ROUTES.hub,
  "/parametres/utilisateurs": SETTINGS_OFFICIAL_ROUTES.users,
  "/parametres/securite": SETTINGS_OFFICIAL_ROUTES.security,
  "/parametres/notifications": SETTINGS_OFFICIAL_ROUTES.notifications,
  "/parametres/systeme": SETTINGS_OFFICIAL_ROUTES.system,
  "/parametres/permissions": SETTINGS_OFFICIAL_ROUTES.permissions,
  "/parametres/devise": SETTINGS_OFFICIAL_ROUTES.currency,
  "/parametres/taux": SETTINGS_OFFICIAL_ROUTES.rates,
  "/parametres/langue": SETTINGS_OFFICIAL_ROUTES.language,
  "/actions/approbations": "/admin/approvals",
  "/actions/alertes": "/admin/alerts",
  "/actions/journaux": "/admin/activity-logs",
  "/archives/globales": "/archives",
  "/archives/exports": "/admin/activity-logs/export",
  "/archives/suppressions": "/admin/activity-logs?actionKey=delete",
  "/vente": "/vente/crm",
};

export function resolveNavRouteAlias(pathname: string): string | null {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized in NAV_ROUTE_ALIASES) {
    return NAV_ROUTE_ALIASES[normalized];
  }
  return null;
}
