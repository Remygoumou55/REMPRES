/**
 * lib/roleRedirects.ts
 * Source unique de vérité pour le mapping role_key → route de destination.
 *
 * Utilisé par :
 *   - app/login/LoginForm.tsx  (côté client)
 *   - app/page.tsx             (côté serveur)
 *   - app/auth/callback/route.ts
 *
 * Convention :
 *   ✅ Module construit   → route réelle  (/dashboard, /vente/nouvelle-vente…)
 *   🚧 Module en chantier → /coming-soon?module=xxx
 */

export const ROLE_REDIRECTS: Record<string, string> = {
  super_admin:               "/dashboard",
  directeur_general:         "/dashboard",
  responsable_vente:         "/vente/nouvelle-vente",
  responsable_rh:            "/rh",
  responsable_formation:     "/formation",
  responsable_consultation:  "/consultation",
  responsable_marketing:     "/marketing",
  responsable_logistique:    "/logistique",
  comptable:                 "/finance",
  auditeur:                  "/admin/activity-logs",
  employe:                   "/dashboard",
};

/**
 * Retourne la route de destination pour un rôle donné.
 * Fallback sécurisé : /dashboard si le rôle est inconnu.
 */
export function getDestinationForRole(roleKey: string | null | undefined): string {
  if (!roleKey) return "/dashboard";
  return ROLE_REDIRECTS[roleKey] ?? "/dashboard";
}
