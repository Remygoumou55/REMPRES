import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getActivityLogsMonitoring } from "@/lib/server/activity-logs";

export type DashboardKpis = {
  clientsTotal: number;
  deletesClientsLast24h: number;
};

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const supabase = getSupabaseServerClient();

  const { count: clientsTotal, error: clientsError } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  if (clientsError) {
    throw new Error(`Impossible de calculer les KPI clients: ${clientsError.message}`);
  }

  const monitoring = await getActivityLogsMonitoring({ moduleKey: "clients" });

  return {
    clientsTotal: clientsTotal ?? 0,
    deletesClientsLast24h: monitoring.deleteCountLast24h,
  };
}
