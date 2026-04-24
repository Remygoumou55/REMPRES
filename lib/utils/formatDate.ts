/**
 * Formatage des dates cohérent pour toute l'app (fr-FR).
 */

const DAY_OPTS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

const DAY_LONG_OPTS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
};

/**
 * Une journée calendaire (affiche la date sans heure ambiguë pour listes).
 */
export function formatDateDayFr(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", DAY_OPTS);
}

/** Date + heure (détail, modale, audit). */
export function formatDateTimeFullFr(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    ...DAY_LONG_OPTS,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Heure courte seule (complément). */
export function formatTimeFr(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
