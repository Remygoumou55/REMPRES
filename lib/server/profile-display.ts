import { cache } from "react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// ---------------------------------------------------------------------------
// Helpers de mise en forme
// ---------------------------------------------------------------------------

/**
 * Formate un prénom + nom en chaîne affichable (capitalize chaque mot, fr).
 * Retourne "" si les deux valeurs sont vides.
 */
export function formatProfileDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();
  if (!f && !l) return "";
  return [f, l]
    .filter(Boolean)
    .join(" ")
    .replace(/\S+/g, (w) =>
      w.charAt(0).toLocaleUpperCase("fr") + w.slice(1).toLocaleLowerCase("fr"),
    );
}

/**
 * Construit un libellé d'affichage à partir du prénom + nom.
 * Si les deux sont vides, utilise `fallback` (défaut : "").
 */
export function profileDisplayNameOrFallback(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = "",
): string {
  const n = formatProfileDisplayName(firstName, lastName).trim();
  return n || fallback;
}

// ---------------------------------------------------------------------------
// Dérivation depuis l'email (quand le profil n'a pas de nom)
// ---------------------------------------------------------------------------

/**
 * Transforme un email en libellé lisible.
 * "remy.garcia@rempres.com" → "Remy Garcia"
 * "r.g@rempres.com"        → "R.G"
 * Retourne "" si l'email est vide.
 */
export function displayNameFromEmail(email: string | null | undefined): string {
  const raw = (email ?? "").trim().toLowerCase();
  if (!raw || !raw.includes("@")) return "";
  const local = raw.split("@")[0]; // partie avant @
  // Remplace séparateurs courants (. _ - +) par espace
  const words = local.split(/[._\-+]+/).filter(Boolean);
  if (!words.length) return "";
  return words
    .map((w) => w.charAt(0).toLocaleUpperCase("fr") + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export function avatarInitialFromDisplayName(
  displayName: string,
  fallback = "?",
): string {
  const t = displayName.trim();
  if (!t) return fallback;
  return t.charAt(0).toLocaleUpperCase("fr");
}

// ---------------------------------------------------------------------------
// Requête profilée (déduplication React cache)
// ---------------------------------------------------------------------------

/**
 * Résout le meilleur libellé d'affichage pour un utilisateur :
 *  1. Prénom + nom (profiles.first_name / last_name)
 *  2. Email converti en nom lisible (profiles.email)
 *  3. "Compte" (fallback final non-générique)
 *
 * Une seule requête DB par userId par rendu React (cache() dédoublonne).
 */
export const getCachedProfileDisplayName = cache(
  async (userId: string): Promise<string> => {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        const sessionUser = await getServerSessionUser();
        const emailLabel = displayNameFromEmail(sessionUser?.email);
        return emailLabel || "Compte";
      }

      // 1. Nom complet
      const fullName = profileDisplayNameOrFallback(data.first_name, data.last_name).trim();
      if (fullName) return fullName;

      // 2. Email → nom lisible
      const emailLabel = displayNameFromEmail(data.email);
      if (emailLabel) return emailLabel;

      // 3. Fallback ultime
      return "Compte";
    } catch {
      return "Compte";
    }
  },
);

// ---------------------------------------------------------------------------
// Libellés en lot (archives, logs…)
// ---------------------------------------------------------------------------

/**
 * Résout les libellés d'affichage pour une liste d'user IDs.
 * Ordre de priorité : prénom+nom → email → id court.
 */
export async function getProfileLabelsByIds(
  userIds: string[],
): Promise<Record<string, string>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return {};

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", unique);

  if (error || !data?.length) return {};

  const out: Record<string, string> = {};
  for (const p of data) {
    const label =
      formatProfileDisplayName(p.first_name, p.last_name).trim() ||
      displayNameFromEmail(p.email) ||
      p.id.slice(0, 8);
    out[p.id] = label;
  }
  return out;
}
