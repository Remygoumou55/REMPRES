import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { shouldMarkRenewalDue } from "@/modules/hr/contracts/utils";

function todayIsoDate(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Met à jour les statuts en fonction des dates (expiration / fenêtre de renouvellement).
 * Pas d’historique métier ici : pas d’utilisateur « système » approuvé pour created_by.
 */
export async function refreshRhContractLifecycleStatuses(): Promise<void> {
  const supabase = getSupabaseServerClient();
  const todayStr = todayIsoDate();

  await supabase
    .from("rh_employee_contracts")
    .update({ status: "expired", updated_by: null })
    .eq("status", "active")
    .not("end_date", "is", null)
    .lt("end_date", todayStr);

  const { data: renewalCandidates } = await supabase
    .from("rh_employee_contracts")
    .select("id,end_date,renewal_window_days,status")
    .eq("status", "active")
    .not("end_date", "is", null);

  const idsToRenewal =
    renewalCandidates?.filter((row) =>
      shouldMarkRenewalDue(row.end_date, row.renewal_window_days),
    ) ?? [];

  await Promise.all(
    idsToRenewal.map((row) =>
      supabase.from("rh_employee_contracts").update({ status: "renewal_due", updated_by: null }).eq("id", row.id),
    ),
  );
}
