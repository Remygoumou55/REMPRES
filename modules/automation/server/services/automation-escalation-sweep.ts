import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";

export async function executeAutomationEscalationSweep(
  admin: SupabaseClient<Database>,
  _job: InfrastructureJobRow,
): Promise<void> {
  const nowIso = new Date().toISOString();

  const { data: overdue, error } = await admin
    .from("erp_automation_workflow_runs")
    .select("id,workflow_key,sla_deadline_at,status,created_by")
    .not("sla_deadline_at", "is", null)
    .lt("sla_deadline_at", nowIso)
    .is("escalated_at", null)
    .in("status", ["pending", "running", "waiting_approval"])
    .limit(40);

  if (error) throw new Error(error.message);

  for (const run of overdue ?? []) {
    const { data: existing } = await admin
      .from("erp_automation_escalations")
      .select("id")
      .eq("workflow_run_id", run.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing?.id) continue;

    const { data: pol } = await admin
      .from("erp_automation_sla_policies")
      .select("escalate_department_key")
      .eq("workflow_key", run.workflow_key)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    const dept = pol?.escalate_department_key ?? null;

    const { data: alert, error: alertErr } = await admin
      .from("governance_alerts")
      .insert({
        type: "automation.sla_breach",
        severity: "high",
        department_key: dept,
        title: `SLA workflow dépassé — ${run.workflow_key}`,
        description: `Exécution ${run.id} — échéance ${run.sla_deadline_at}`,
        entity_type: "automation_workflow_run",
        entity_id: run.id,
        triggered_by: null,
        status: "unread",
        metadata: { workflow_key: run.workflow_key },
      })
      .select("id")
      .maybeSingle();

    if (alertErr) throw new Error(alertErr.message);
    if (!alert?.id) throw new Error("automation.alert_insert_failed");

    const { error: escErr } = await admin.from("erp_automation_escalations").insert({
      workflow_run_id: run.id,
      status: "pending",
      escalation_level: 1,
      governance_alert_id: alert.id,
      metadata: {},
    });

    if (escErr) throw new Error(escErr.message);

    const { error: runErr } = await admin
      .from("erp_automation_workflow_runs")
      .update({ escalated_at: nowIso })
      .eq("id", run.id);

    if (runErr) throw new Error(runErr.message);
  }
}
