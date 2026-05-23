import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { safeFirst } from "@/lib/utils/safe-query";

export type UserDisplay = {
  firstName: string;
  fullName: string;
  initials: string;
};

type ProfileNameRow = {
  first_name: string | null;
  last_name: string | null;
};

async function fetchUserDisplay(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail?: string,
): Promise<UserDisplay> {
  const profile = await safeFirst<ProfileNameRow>(
    supabase.from("profiles").select("first_name, last_name").eq("id", userId).maybeSingle(),
  );
  const firstName = profile?.first_name || userEmail?.split("@")[0] || "vous";
  const lastName = profile?.last_name || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const initials =
    [profile?.first_name?.[0] || "", profile?.last_name?.[0] || ""]
      .filter(Boolean)
      .join("")
      .toUpperCase() || "U";
  return { firstName, fullName, initials };
}

export const getUserDisplay = cache(async (userId: string, userEmail?: string): Promise<UserDisplay> => {
  const supabase = getSupabaseServerClient();
  return fetchUserDisplay(supabase, userId, userEmail);
});

export async function getUserDisplayWithClient(
  supabase: SupabaseClient<Database>,
  userId: string,
  userEmail?: string,
): Promise<UserDisplay> {
  return fetchUserDisplay(supabase, userId, userEmail);
}
