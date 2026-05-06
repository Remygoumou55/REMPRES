"use client";

import { useCallback } from "react";
import { hrefCloseModalFromBrowserLocation } from "@/lib/routing/modal-query";

/**
 * Ferme une modale pilotée par l’URL (`?create=1`, `?edit=<id>`, `?view=<id>`) en retirant ces paramètres
 * tout en conservant filtres, pagination, messages flash, etc.
 *
 * Navigation document complète (`location.assign`) : avec les Server Components, `router.replace`
 * seul peut laisser `searchParams` inchangés côté serveur → la modale restait ouverte.
 *
 * Utiliser pour Annuler, ✕, overlay et Échap — même logique partout.
 */
export function useCloseModalNavigation() {
  return useCallback(() => {
    const target = hrefCloseModalFromBrowserLocation();
    window.location.assign(target);
  }, []);
}
