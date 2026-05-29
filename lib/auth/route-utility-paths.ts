/** Préfixes routes utilitaires — partagés edge + app (pas de dépendance circulaire). */

export const AUTHENTICATED_UTILITY_PREFIXES = ["/profil", "/coming-soon"] as const;

export const ADMIN_UTILITY_PREFIXES = ["/direction", "/erp"] as const;

export const LAYOUT_GUARDED_PREFIXES = ["/operations"] as const;

function normalizeRoutePath(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function pathnameMatchesPrefixes(pathname: string, prefixes: readonly string[]): boolean {
  const path = normalizeRoutePath(pathname);
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

export function isAuthenticatedUtilityPath(pathname: string): boolean {
  return pathnameMatchesPrefixes(pathname, AUTHENTICATED_UTILITY_PREFIXES);
}

export function isAdminUtilityPath(pathname: string): boolean {
  return pathnameMatchesPrefixes(pathname, ADMIN_UTILITY_PREFIXES);
}

export function isLayoutGuardedPath(pathname: string): boolean {
  return pathnameMatchesPrefixes(pathname, LAYOUT_GUARDED_PREFIXES);
}
