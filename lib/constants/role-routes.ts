/**
 * @deprecated Étape 4 — accès routes gouverné par route-authority + edgeCanAccessPathForProfile.
 * Conservé pour référence migrations ; ne plus utiliser dans middleware.
 */
const ALWAYS_ALLOWED_PREFIXES = ["/access-denied", "/error-profile", "/login", "/auth/"];

/** @deprecated Legacy allowlist — fuite /dept cross-slug corrigée dans dept-cockpit-route. */
export const DEPT_ALLOWED_ROUTES: Record<string, string[]> = {
  responsable_vente: ["/dashboard", "/dept", "/vente"],
  comptable: ["/dashboard", "/dept", "/finance"],
  responsable_rh: ["/dashboard", "/dept", "/rh"],
  responsable_formation: [
    "/dashboard",
    "/dept/formation",
    "/dept/consultation",
    "/formation",
    "/formation/formations",
    "/formation/formations/new",
    "/formation/apprenants",
    "/formation/apprenants/new",
    "/formation/inscriptions",
    "/formation/certificats",
    "/consultation",
    "/consultation/missions",
    "/consultation/missions/new",
    "/consultation/agenda",
    "/consultation/agenda/new",
    "/consultation/clients",
  ],
  /** @deprecated Legacy — même périmètre que responsable_formation. */
  responsable_consultation: [
    "/dashboard",
    "/dept/formation",
    "/dept/consultation",
    "/formation",
    "/consultation",
  ],
  responsable_marketing: ["/dashboard", "/dept", "/marketing"],
  responsable_logistique: ["/dashboard", "/dept", "/logistique"],
  employe: ["/dashboard", "/dept"],
  auditeur: ["/dashboard", "/dept", "/admin/activity-logs"],
};

function normalizeRole(role: string): string {
  return String(role ?? "").trim().toLowerCase();
}

/** @deprecated Utiliser edgeCanAccessPathForProfile — retourne true si rôle hors legacy map. */
export function isDeptRouteAllowed(role: string, pathname: string): boolean {
  const allowed = DEPT_ALLOWED_ROUTES[normalizeRole(role)];
  if (!allowed) return true;

  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
