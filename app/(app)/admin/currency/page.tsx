import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { CurrencyAdminClient } from "./CurrencyAdminClient";

export const metadata: Metadata = { title: "Taux de change" };

export default async function CurrencyAdminPage() {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");
  if (!(await isSuperAdmin(auth.user.id))) redirect("/access-denied");

  // Lire les taux actuels depuis la base
  const { data: rows } = await supabase
    .from("currency_rates")
    .select("currency_code, rate_to_gnf, updated_at")
    .order("currency_code");

  return (
    <CurrencyAdminClient
      rows={rows ?? []}
      isSuperAdmin
    />
  );
}
