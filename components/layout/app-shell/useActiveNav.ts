"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { ModuleId } from "./types";

/**
 * Détermine le module actif pour le rail principal et le menu secondaire.
 * L'ordre des préfixes compte (chemins les plus spécifiques en premier).
 */
export function useActiveNav(): ModuleId {
  const pathname = usePathname();

  return useMemo<ModuleId>(() => {
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/config")) return "admin";
    if (pathname.startsWith("/admin") || pathname.startsWith("/archives")) return "admin";
    if (pathname.startsWith("/vente/crm")) return "crm";
    if (pathname.startsWith("/vente")) return "commerce";
    if (pathname.startsWith("/finance")) return "finance";
    if (pathname.startsWith("/logistique")) return "logistics";
    if (pathname.startsWith("/rh")) return "rh";
    if (pathname.startsWith("/actions")) return "actions";
    if (pathname.startsWith("/dept")) return "dashboard";
    return "dashboard";
  }, [pathname]);
}
