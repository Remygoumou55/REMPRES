import { isArchivesGovernancePath } from "@/lib/archives/governance-nav";
import { isGovernanceActionsPath } from "@/lib/actions/governance-nav";
import {
  SETTINGS_LEGACY_ALIAS_REDIRECTS,
  SETTINGS_OFFICIAL_ROUTES,
  isSettingsOfficialPath,
} from "@/lib/settings/official-routes";

/**
 * Préfixes `/admin/*` conservés pour Actions + Archives uniquement (pas Paramètres).
 */
const ADMIN_GOVERNANCE_ALLOWED_EXACT = new Set([
  "/admin/platform-dashboard",
  "/admin/intelligence",
  "/admin/global-dashboard",
]);

const ADMIN_GOVERNANCE_ALLOWED_PREFIXES = [
  "/admin/approvals",
  "/admin/alerts",
  "/admin/audit",
  "/admin/activity-logs",
  "/admin/archives",
] as const;

function normalize(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const base = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

/** Chemins historiques Paramètres (alias) — doivent rediriger vers l’URL officielle. */
export function resolveSettingsLegacyAliasRedirect(pathname: string): string | null {
  const path = normalize(pathname);
  const direct = SETTINGS_LEGACY_ALIAS_REDIRECTS[path];
  if (direct) return direct;
  if (path.startsWith("/config/")) return SETTINGS_OFFICIAL_ROUTES.permissions;
  if (path.startsWith("/admin/users/")) return SETTINGS_OFFICIAL_ROUTES.users;
  return null;
}

/** `/admin/*` autorisé pour gouvernance Actions / Archives (hors Paramètres). */
export function isAllowedAdminGovernancePath(pathname: string): boolean {
  const path = normalize(pathname);
  if (ADMIN_GOVERNANCE_ALLOWED_EXACT.has(path)) return true;
  return ADMIN_GOVERNANCE_ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Route `/admin` legacy non gouvernée (IA, cloud, plateforme, etc.) → verrouillage Paramètres.
 */
export function isBlockedLegacyAdminPath(pathname: string): boolean {
  const path = normalize(pathname);
  if (!path.startsWith("/admin")) return false;
  if (resolveSettingsLegacyAliasRedirect(path)) return false;
  if (isAllowedAdminGovernancePath(path)) return false;
  if (isGovernanceActionsPath(path)) return false;
  if (isArchivesGovernancePath(path, null)) return false;
  return true;
}

/** Redirection middleware : alias Paramètres ou admin legacy bloqué. */
export function resolveSettingsGovernanceRedirect(pathname: string): string | null {
  const alias = resolveSettingsLegacyAliasRedirect(pathname);
  if (alias) return alias;
  if (isBlockedLegacyAdminPath(pathname)) return SETTINGS_OFFICIAL_ROUTES.hub;
  return null;
}

export function isSettingsGovernancePath(pathname: string): boolean {
  return isSettingsOfficialPath(pathname);
}
