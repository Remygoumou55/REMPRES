/**
 * Tailles de page homologuées pour les listes filtres (clients, journaux, audit, …).
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSizeOption = 25;

/** Historique des ventes — pas de sélecteur de taille ; valeur serveur unique. */
export const SALES_HISTORY_PAGE_SIZE = 20;

/** Délai avant synchronisation URL des filtres clients (évite rafales router.replace). */
export const CLIENT_FILTER_URL_DEBOUNCE_MS = 250;

/** Délai par défaut pour la recherche inline côté client (`useGlobalSearch`, barres de recherche liste). */
export const GLOBAL_LIST_SEARCH_DEBOUNCE_MS = 250;
