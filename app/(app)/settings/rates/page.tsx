import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { CurrencyAdminClient } from "@/app/(app)/admin/currency/CurrencyAdminClient";

export const metadata: Metadata = { title: "Taux — Paramètres" };

export default async function SettingsRatesPage() {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) redirect("/login");
  if (!(await isAdminRole(auth.user.id))) redirect("/access-denied");

  const { data: rows } = await supabase
    .from("currency_rates")
    .select("currency_code, rate_to_gnf, updated_at")
    .order("currency_code");

  return (
    <div className="page-wrapper">
      <PageHeader title="Taux de change" subtitle="Taux globaux ERP — source unique de conversion." />
      <CurrencyAdminClient rows={rows ?? []} isSuperAdmin />
    </div>
  );
}
