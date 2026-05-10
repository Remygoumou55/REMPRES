import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import { INFRA_QUEUE_KEYS } from "@/modules/infrastructure/constants/queue-keys";
import { enqueueInfrastructureJobAdmin } from "@/modules/infrastructure/server/repositories/infrastructure-job-admin-repository";
import { AUTOMATION_INFRA_JOB_TYPES } from "@/modules/automation/constants/infrastructure-bridge";

function intervalMinutes(template: unknown): number {
  if (!template || typeof template !== "object" || Array.isArray(template)) return 60;
  const raw = (template as Record<string, unknown>).interval_minutes;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 5 || n > 10080) return 60;
  return Math.floor(n);
}

export async function executeAutomationScheduleSweep(
  admin: SupabaseClient<Database>,
  _job: InfrastructureJobRow,
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data: due, error } = await admin
    .from("erp_automation_schedules")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_at", nowIso)
    .order("next_run_at", { ascending: true })
    .limit(25);

  if (error) throw new Error(error.message);

  for (const sched of due ?? []) {
    const mins = intervalMinutes(sched.payload_template);
    const nextRun = new Date(Date.now() + mins * 60_000).toISOString();

    const { data: runRow, error: runErr } = await admin
      .from("erp_automation_workflow_runs")
      .insert({
        workflow_key: sched.workflow_key,
        status: "pending",
        context: (sched.payload_template ?? {}) as Json,
        created_by: sched.created_by,
      })
      .select("id")
      .maybeSingle();

    if (runErr) throw new Error(runErr.message);
    if (!runRow?.id) throw new Error("automation.schedule_run_insert_failed");

    const enq = await enqueueInfrastructureJobAdmin(admin, {
      queueKey: INFRA_QUEUE_KEYS.automation,
      domainKey: "automation",
      jobType: AUTOMATION_INFRA_JOB_TYPES.workflowRunTick,
      payload: { run_id: runRow.id, schedule_id: sched.id },
      priority: 4,
      createdBy: sched.created_by,
      idempotencyKey: `sched_tick:${sched.id}:${runRow.id}`,
    });

    if ("error" in enq) throw new Error(enq.error);

    const { error: upErr } = await admin
      .from("erp_automation_schedules")
      .update({
        last_run_at: nowIso,
        next_run_at: nextRun,
      })
      .eq("id", sched.id);

    if (upErr) throw new Error(upErr.message);
  }
}
