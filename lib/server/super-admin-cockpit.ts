import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { DashboardKpis } from "@/lib/server/dashboard-kpis";
import { getDashboardKpis } from "@/lib/server/dashboard-kpis";
import { getExecutiveGlobalSnapshotService } from "@/modules/executive-dashboard/server/services";
import type { ExecutiveGlobalSnapshot } from "@/modules/executive-dashboard/types/domain";

export type SuperAdminGovernanceAlertRow = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  created_at: string;
  department_key: string | null;
};

export type SuperAdminCockpitPayload = {
  generatedAtIso: string;
  kpis: DashboardKpis;
  executive: ExecutiveGlobalSnapshot | null;
  executiveLoadError: string | null;
  pendingApprovals: number;
  governanceAlerts: SuperAdminGovernanceAlertRow[];
};

export async function getSuperAdminCockpitPayload(
  viewerUserId: string,
  opts?: { kpis?: DashboardKpis },
): Promise<SuperAdminCockpitPayload> {
  const supabase = getSupabaseServerClient();
  const generatedAtIso = new Date().toISOString();
  const kpis = opts?.kpis ?? (await getDashboardKpis());

  const [executiveSnap, approvalsRes, alertsRes] = await Promise.all([
    getExecutiveGlobalSnapshotService({ viewerUserId, elevated: true }).catch((err: unknown) => ({
      __err: err instanceof Error ? err.message : String(err),
    })),
    supabase.from("approval_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("governance_alerts")
      .select("id, severity, title, description, created_at, department_key, status")
      .eq("status", "unread")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  let executive: ExecutiveGlobalSnapshot | null = null;
  let executiveLoadError: string | null = null;
  if (executiveSnap && typeof executiveSnap === "object" && "__err" in executiveSnap) {
    executiveLoadError = String((executiveSnap as { __err: string }).__err);
  } else {
    executive = executiveSnap as ExecutiveGlobalSnapshot;
  }

  const governanceAlerts: SuperAdminGovernanceAlertRow[] = (alertsRes.data ?? [])
    .filter((r) => r.severity === "high" || r.severity === "critical" || r.severity === "medium" || r.severity === "low")
    .map((r) => ({
      id: r.id,
      severity: r.severity as SuperAdminGovernanceAlertRow["severity"],
      title: r.title,
      description: r.description,
      created_at: r.created_at,
      department_key: r.department_key,
    }));

  return {
    generatedAtIso,
    kpis,
    executive,
    executiveLoadError,
    pendingApprovals: approvalsRes.count ?? 0,
    governanceAlerts,
  };
}
