/** Manipulation d’URL pour modales (création / lecture / édition) sans casser filtres ni flash. */

function splitHref(href: string): { pathname: string; search: string; hash: string } {
  const [pathPart, hash = ""] = href.split("#");
  const [pathname, search = ""] = pathPart.split("?");
  return { pathname, search: search.replace(/^\?/, ""), hash };
}

function joinHref(pathname: string, params: URLSearchParams, hash: string): string {
  const qs = params.toString();
  const base = qs ? `${pathname}?${qs}` : pathname;
  return hash ? `${base}#${hash}` : base;
}

function mutateQuery(href: string, mut: (p: URLSearchParams) => void): string {
  const { pathname, search, hash } = splitHref(href);
  const p = new URLSearchParams(search);
  mut(p);
  return joinHref(pathname, p, hash);
}

/** Dernier segment de chemin (id ressource sur routes `/.../[id]`). */
export function entityIdFromResourcePath(href: string): string | null {
  try {
    const pathOnly = href.trim().split("#")[0]?.split("?")[0] ?? "";
    const parts = pathOnly.split("/").filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1]! : null;
  } catch {
    return null;
  }
}

/** Formulaire d’édition ouvert sur une page détail (`?edit=<id>` ; `edit=1` conservé pour anciennes URLs). */
export function isDetailEditOpen(
  edit: string | string[] | undefined,
  resourceId: string,
): boolean {
  if (edit == null) return false;
  const v = Array.isArray(edit) ? edit[0] : edit;
  return v === resourceId || v === "1";
}

/**
 * Édition : `edit=<entityId>`, retire `view` pour éviter deux modes actifs.
 */
export function withEditModalQuery(href: string, entityId: string): string {
  return mutateQuery(href, (p) => {
    p.set("edit", entityId);
    p.delete("view");
  });
}

/**
 * Lecture / « Voir » : `view=<entityId>`, retire `edit`.
 */
export function withViewModalQuery(href: string, entityId: string): string {
  return mutateQuery(href, (p) => {
    p.set("view", entityId);
    p.delete("edit");
  });
}

/** Création depuis la liste : `create=1`, sans conflit avec edit/view. */
export function withCreateModalQuery(href: string): string {
  return mutateQuery(href, (p) => {
    p.set("create", "1");
    p.delete("edit");
    p.delete("view");
  });
}

/** Paramètres d’URL qui pilotent une modale ou un mode page. */
export const MODAL_ACTION_PARAM_KEYS = ["create", "edit", "view"] as const;

/** Copie des query params sans les clés d’ouverture de modale / mode. */
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
