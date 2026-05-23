/**
 * Supervision/Governance layer policies.
 * Source unique pour isoler le super_admin des workflows opérationnels.
 */

import {
  isAllowedAdminGovernancePath,
  isSettingsGovernancePath,
  resolveSettingsLegacyAliasRedirect,
} from "@/lib/settings/legacy-route-lock";
import { isGovernanceActionsPath } from "@/lib/actions/governance-nav";
import { isArchivesGovernancePath } from "@/lib/archives/governance-nav";

export const SUPER_ADMIN_GOVERNANCE_ALLOWED_PREFIXES: readonly string[] = [
  "/dashboard",
  "/dept",
  "/actions",
  "/archives",
  "/settings",
  "/access-denied",
  "/error-profile",
  "/auth/set-password",
] as const;

/** Vente : uniquement historique / archives figées (pas de POS, CRM, CRUD actifs). */
export const SUPER_ADMIN_READ_ONLY_VENTE_PREFIXES: readonly string[] = [
  "/vente/clients/archives",
  "/vente/produits/archives",
  "/vente/historique",
  "/vente/recu",
] as const;

export const SUPER_ADMIN_OPERATIONAL_BLOCKED_PREFIXES: readonly string[] = [
  "/vente",
  "/finance",
  "/rh",
  "/formation",
  "/consultation",
  "/marketing",
  "/logistique",
] as const;

/** Entrées cockpit module (racine uniquement) — accessibles au super_admin via le rail Métier. */
export const SUPER_ADMIN_MODULE_ENTRY_PATHS: readonly string[] = [
  "/vente/crm",
  "/finance",
  "/rh",
  "/formation",
  "/consultation",
  "/marketing",
  "/logistique",
] as const;

function pathnameMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function normalizePathname(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

/** Chemins vente autorisés en lecture / traçabilité pour super_admin. */
export function isSuperAdminReadOnlyVentePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return SUPER_ADMIN_READ_ONLY_VENTE_PREFIXES.some((prefix) => pathnameMatchesPrefix(normalized, prefix));
}

export function isSuperAdminGovernancePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (SUPER_ADMIN_GOVERNANCE_ALLOWED_PREFIXES.some((prefix) => pathnameMatchesPrefix(normalized, prefix))) {
    return true;
  }
  if (isSettingsGovernancePath(normalized)) return true;
  if (resolveSettingsLegacyAliasRedirect(normalized)) return true;
  if (isGovernanceActionsPath(normalized)) return true;
  if (isAllowedAdminGovernancePath(normalized)) return true;
  if (isArchivesGovernancePath(normalized, null)) return true;
  return false;
}

/**
 * Route « opérationnelle » pour super_admin : tout périmètre métier actif,
 * sauf exceptions explicites (archives vente + historique + reçu).
 */
export function isSuperAdminOperationalPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (isSuperAdminReadOnlyVentePath(normalized)) return false;
  if (SUPER_ADMIN_MODULE_ENTRY_PATHS.some((p) => normalized === p)) return false;
  return SUPER_ADMIN_OPERATIONAL_BLOCKED_PREFIXES.some((prefix) =>
    pathnameMatchesPrefix(normalized, prefix),
  );
}
