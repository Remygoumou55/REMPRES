import { cache } from "react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Chaîne affichable à partir des seules colonnes `profiles.first_name` / `last_name`
 * (pas d’email, pas de metadata Auth).
 */
export function formatProfileDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();
  if (!f && !l) {
    return "";
  }
  const raw = [f, l].filter(Boolean).join(" ");
  return raw.replace(/\S+/g, (word) => {
    if (!word.length) return word;
    return word.charAt(0).toLocaleUpperCase("fr") + word.slice(1).toLocaleLowerCase("fr");
  });
}

export function profileDisplayNameOrFallback(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback = "Utilisateur",
): string {
  const n = formatProfileDisplayName(firstName, lastName).trim();
  return n || fallback;
}

export function avatarInitialFromDisplayName(displayName: string, fallback = "U"): string {
  const t = displayName.trim();
  if (!t) return fallback;
  return t.charAt(0).toLocaleUpperCase("fr");
}

/** Une requête profil par rendu React (dédoublonnée entre layout + pages). */
export const getCachedProfileDisplayName = cache(async (userId: string): Promise<string> => {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return profileDisplayNameOrFallback(null, null);
    }
    return profileDisplayNameOrFallback(data.first_name, data.last_name);
  } catch {
    return profileDisplayNameOrFallback(null, null);
  }
});
