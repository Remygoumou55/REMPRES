import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";
import type { AutomationWorkflowRunRow } from "@/modules/automation/types";

function payloadRecord(payload: Json): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return {};
}

function parseSteps(definition: Json): { type?: string; label?: string }[] {
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) return [];
  const raw = (definition as { steps?: unknown }).steps;
  if (!Array.isArray(raw)) return [];
  return raw.filter((s) => s && typeof s === "object") as { type?: string; label?: string }[];
}

/** Une étape atomique par tick — résilience & observabilité batch. */
export async function executeAutomationWorkflowRunTick(
  admin: SupabaseClient<Database>,
  job: InfrastructureJobRow,
): Promise<void> {
  const runId = String(payloadRecord(job.payload).run_id ?? "").trim();
  if (!runId) throw new Error("automation.missing_run_id");

  const { data: runRow, error: runErr } = await admin
    .from("erp_automation_workflow_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (runErr) throw new Error(runErr.message);
  const run = runRow as AutomationWorkflowRunRow | null;
  if (!run) throw new Error("automation.run_not_found");

  if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
    return;
  }

  const { data: defRow, error: defErr } = await admin
    .from("erp_automation_workflow_definitions")
    .select("*")
    .eq("workflow_key", run.workflow_key)
    .maybeSingle();

  if (defErr) throw new Error(defErr.message);
  if (!defRow?.workflow_key) throw new Error("automation.definition_not_found");

  const steps = parseSteps(defRow.definition as Json);
  if (steps.length === 0) {
    const { error } = await admin
      .from("erp_automation_workflow_runs")
      .update({
        status: "completed",
        current_step: 0,
        last_error: null,
      })
      .eq("id", run.id);
    if (error) throw new Error(error.message);
    return;
  }

  if (run.status === "pending") {
    const { error } = await admin
      .from("erp_automation_workflow_runs")
      .update({ status: "running", last_error: null })
      .eq("id", run.id);
    if (error) throw new Error(error.message);
  }

  const idx = run.current_step;
  const step = steps[idx];
  if (!step) {
    const { error } = await admin
      .from("erp_automation_workflow_runs")
      .update({ status: "completed", last_error: null })
      .eq("id", run.id);
    if (error) throw new Error(error.message);
    return;
  }

  const stepType = String(step.type ?? "noop").toLowerCase();
  const correlation =
    String(payloadRecord(run.context as Json).correlation_id ?? "").trim() || run.id;

  if (stepType === "audit_log") {
    const { error: evErr } = await admin.from("erp_automation_events").insert({
      event_key: "automation.workflow.step",
      domain_key: defRow.domain_key,
      aggregate_type: "automation.workflow_run",
      aggregate_id: run.id,
      correlation_id: correlation,
      payload: {
        workflow_key: run.workflow_key,
        step_index: idx,
        label: step.label ?? null,
      },
      created_by: null,
    });
    if (evErr) throw new Error(evErr.message);
  }

  if (stepType === "approval" || stepType === "wait_approval") {
    const { error } = await admin
      .from("erp_automation_workflow_runs")
      .update({
        status: "waiting_approval",
        last_error: null,
      })
      .eq("id", run.id);
    if (error) throw new Error(error.message);
    return;
  }

  const nextIndex = idx + 1;
  const done = nextIndex >= steps.length;
  const { error } = await admin
    .from("erp_automation_workflow_runs")
    .update({
      current_step: nextIndex,
      status: done ? "completed" : "running",
      last_error: null,
    })
    .eq("id", run.id);

  if (error) throw new Error(error.message);
}
