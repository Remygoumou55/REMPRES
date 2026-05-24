const ALWAYS_ALLOWED_PREFIXES = ["/access-denied", "/error-profile", "/login", "/auth/"];

export const DEPT_ALLOWED_ROUTES: Record<string, string[]> = {
  responsable_vente: ["/dashboard", "/dept", "/vente"],
  comptable: ["/dashboard", "/dept", "/finance"],
  responsable_rh: ["/dashboard", "/dept", "/rh"],
  responsable_formation: ["/dashboard", "/dept", "/formation"],
  responsable_consultation: ["/dashboard", "/dept", "/consultation"],
  responsable_marketing: ["/dashboard", "/dept", "/marketing"],
  responsable_logistique: ["/dashboard", "/dept", "/logistique"],
  employe: ["/dashboard", "/dept"],
  auditeur: ["/dashboard", "/dept", "/admin/activity-logs"],
};

function normalizeRole(role: string): string {
  return String(role ?? "").trim().toLowerCase();
}

export function isDeptRouteAllowed(role: string, pathname: string): boolean {
  const allowed = DEPT_ALLOWED_ROUTES[normalizeRole(role)];
  if (!allowed) return true;

  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  return allowed.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
