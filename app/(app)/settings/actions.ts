"use server";

import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { normalizeLocale } from "@/lib/i18n/config";
import { revalidateSettings } from "@/lib/cache/revalidation-map";

export async function updatePreferredLanguageAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("preferredLanguage") ?? ""));
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;

  await supabase
    .from("profiles")
    .update({ preferred_language: locale })
    .eq("id", data.user.id)
    .is("deleted_at", null);

  cookies().set("erp_locale", locale, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  await revalidateSettings();
}
