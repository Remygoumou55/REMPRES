function withQueryParam(href: string, key: string, value: string): string {
  const [path, hash = ""] = href.split("#");
  const separator = path.includes("?") ? "&" : "?";
  const base = path.includes(`${key}=`) ? path : `${path}${separator}${key}=${value}`;
  return hash ? `${base}#${hash}` : base;
}

export function withEditModalQuery(href: string): string {
  return withQueryParam(href, "edit", "1");
}

export function withCreateModalQuery(href: string): string {
  return withQueryParam(href, "create", "1");
}

/** Paramètres d’URL qui ouvrent une modale (création / édition rapide). */
export const MODAL_ACTION_PARAM_KEYS = ["create", "edit"] as const;

/** Copie des query params sans les clés d’ouverture de modale. */
export function cloneSearchParamsWithoutModalActions(source: URLSearchParams | string): URLSearchParams {
  const raw = typeof source === "string" ? source.replace(/^\?/, "") : source.toString();
  const p = new URLSearchParams(raw);
  for (const key of MODAL_ACTION_PARAM_KEYS) {
    p.delete(key);
  }
  return p;
}

/**
 * URL complète après fermeture de modale (même chemin, filtres conservés).
 * À utiliser côté client avec `window.location` ou `useSearchParams`.
 */
export function hrefAfterClosingModal(pathname: string, searchParams: URLSearchParams): string {
  const p = cloneSearchParamsWithoutModalActions(searchParams);
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Fermeture fiable depuis le navigateur (évite les désynchronisations useSearchParams).
 */
export function hrefCloseModalFromBrowserLocation(): string {
  if (typeof window === "undefined") return "/";
  const path = window.location.pathname;
  const qsRaw = window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;
  const p = cloneSearchParamsWithoutModalActions(qsRaw);
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}
