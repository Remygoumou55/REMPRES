/**
 * Normalisation de texte affiché (noms, libellés) — client & serveur.
 */

/** Corrige les chaînes encodées par erreur (ex. "R%c3%a9my" → "Rémy"). */
export function normalizeDisplayText(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (!/%[0-9A-Fa-f]{2}/.test(raw)) return raw;
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

/** Valeur sûre pour en-tête HTTP (caractères accentués). */
export function encodeHeaderText(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  return encodeURIComponent(raw);
}

/** Restaure une valeur lue depuis un en-tête HTTP. */
export function decodeHeaderText(value: string | null | undefined): string | null {
  const decoded = normalizeDisplayText(value);
  return decoded || null;
}
