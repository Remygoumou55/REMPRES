/**
 * Registre officiel des routes /admin/* — aligné edge-route-guards (Bloc 2 Étape 2).
 * Toute route hors KEEP est legacy : middleware redirige SA vers Paramètres.
 */

export const ADMIN_ROUTE_KEEP_EXACT = [
  "/admin",
  "/admin/platform-dashboard",
  "/admin/intelligence",
  "/admin/global-dashboard",
] as const;

export const ADMIN_ROUTE_KEEP_PREFIXES = [
  "/admin/approvals",
  "/admin/alerts",
  "/admin/audit",
  "/admin/activity-logs",
  "/admin/archives",
  "/admin/exports",
  "/admin/suppressions",
  "/admin/users",
  "/admin/departments",
] as const;

export type AdminRouteDisposition = "KEEP" | "ARCHIVE" | "DELETE";

export function normalizeAdminPath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const base = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

export function isAdminRouteKept(pathname: string): boolean {
  const path = normalizeAdminPath(pathname);
  if (!path.startsWith("/admin")) return false;
  if (ADMIN_ROUTE_KEEP_EXACT.includes(path as (typeof ADMIN_ROUTE_KEEP_EXACT)[number])) {
    return true;
  }
  return ADMIN_ROUTE_KEEP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Segments App Router conservés sous app/(app)/admin/ */
export const ADMIN_APP_SEGMENTS_KEPT = [
  "page.tsx",
  "approvals",
  "alerts",
  "audit",
  "activity-logs",
  "archives",
  "exports",
  "suppressions",
  "platform-dashboard",
  "intelligence",
  "global-dashboard",
  "users",
  "departments",
] as const;
