/**
 * Supervision/Governance layer policies.
 * Source unique pour isoler le super_admin des workflows opérationnels.
 */

export const SUPER_ADMIN_GOVERNANCE_ALLOWED_PREFIXES: readonly string[] = [
  "/dashboard",
  "/dept",
  "/admin",
  "/settings",
  "/access-denied",
  "/error-profile",
  "/auth/set-password",
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

function pathnameMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function normalizePathname(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function isSuperAdminGovernancePath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return SUPER_ADMIN_GOVERNANCE_ALLOWED_PREFIXES.some((prefix) =>
    pathnameMatchesPrefix(normalized, prefix),
  );
}

export function isSuperAdminOperationalPath(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  return SUPER_ADMIN_OPERATIONAL_BLOCKED_PREFIXES.some((prefix) =>
    pathnameMatchesPrefix(normalized, prefix),
  );
}
