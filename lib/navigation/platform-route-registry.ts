/**
 * Platform module ↔ route alignment — post admin legacy cleanup (Bloc 2 Étape 3).
 */
import { isAdminRouteKept } from "@/lib/navigation/admin-route-registry";

export const PLATFORM_VERTICAL_ADMIN_HUB: Record<string, string> = {
  ai: "/admin/intelligence",
  cloud: "/admin/platform-dashboard",
  observability: "/admin/platform-dashboard",
  governance: "/admin/platform-dashboard",
  tenants: "/admin/global-dashboard",
};

export function resolvePlatformAdminHub(vertical: string): string {
  return PLATFORM_VERTICAL_ADMIN_HUB[vertical] ?? "/admin/platform-dashboard";
}

export function isOperationalHrefRoutable(href: string): boolean {
  const path = href.split("?")[0]?.split("#")[0] ?? href;
  if (!path.startsWith("/admin")) return true;
  return isAdminRouteKept(path);
}
