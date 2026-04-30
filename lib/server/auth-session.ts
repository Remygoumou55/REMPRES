import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Session serveur : une seule lecture `auth.getUser()` par requête RSC
 * (évite les doublons typiques layout AppShell + page).
 */
export const getServerSessionUser = cache(async (): Promise<User | null> => {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
});
