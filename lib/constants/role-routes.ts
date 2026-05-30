/**
 * @deprecated Étape 4 — accès routes gouverné par route-authority + edgeCanAccessPathForProfile.
 * Conservé pour référence migrations ; ne plus utiliser dans middleware.
 */
const ALWAYS_ALLOWED_PREFIXES = ["/access-denied", "/error-profile", "/login", "/auth/"];

/** @deprecated Legacy allowlist — fuite /dept cross-slug corrigée dans dept-cockpit-route. */
export const DEPT_ALLOWED_ROUTES: Record<string, string[]> = {
  responsable_vente: ["/dashboard", "/dept", "/vente", "/vente/statistiques", "/vente/devis", "/profil"],
  comptable: [
    "/dashboard",
    "/dept",
    "/finance",
    "/finance/bilans",
    "/finance/rapprochement",
    "/profil",
  ],
  responsable_rh: [
    "/dashboard",
    "/dept",
    "/dept/rh",
    "/rh",
    "/rh/collaborateurs",
    "/rh/collaborateurs/new",
    "/rh/conges",
    "/rh/conges/new",
    "/rh/presences",
    "/rh/presences/new",
    "/rh/fiches-de-paie",
    "/rh/evaluations",
    "/profil",
  ],
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
    "/profil",
  ],
  /** @deprecated Legacy — alias de responsable_formation (Consultation fusionnée). */
  responsable_consultation: [
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
    "/profil",
  ],
  responsable_marketing: [
    "/dashboard",
    "/dept",
    "/dept/marketing",
    "/marketing",
    "/marketing/campagnes",
    "/marketing/campagnes/new",
    "/marketing/leads",
    "/marketing/leads/new",
    "/marketing/analytics",
    "/profil",
  ],
  responsable_logistique: [
    "/dashboard",
    "/dept",
    "/dept/logistique",
    "/logistique",
    "/logistique/articles",
    "/logistique/articles/new",
    "/logistique/mouvements",
    "/logistique/mouvements/new",
    "/logistique/inventaire",
    "/logistique/fournisseurs",
    "/logistique/fournisseurs/new",
    "/logistique/achats",
    "/logistique/commandes",
    "/logistique/alertes",
    "/logistique/achats/new",
    "/logistique/stock",
    "/logistique/dashboard",
    "/profil",
  ],
  employe: ["/dashboard", "/dept", "/profil"],
  directeur_general: [
    "/dashboard",
    "/dashboard/executive",
    "/executive",
    "/executive/rapport-hebdomadaire",
    "/executive/previsions",
    "/dept",
    "/profil",
  ],
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
