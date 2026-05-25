/**
 * Bloc 3 — Mutations Operations / Project gouvernées.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  assertOpsWriteActionAllowed,
  OPS_WRITE_ACTIONS,
} from "@/lib/operations/runtime/operations-write-governance";
import {
  emitOpsDeliveryCompleted,
  emitOpsExecutionDelayed,
  emitOpsProjectCreated,
  emitOpsTaskAssigned,
  emitOpsTaskCompleted,
  emitOpsTaskCreated,
  emitOpsWorkflowApproved,
  emitOpsWorkflowStarted,
} from "@/lib/erp-core/events/integrations/ops-events";
import { recordOpsGovernanceAudit } from "@/modules/operations/server/services/ops-audit-hook";
import { OFFICIAL_ERP_EVENT_TYPES } from "@/lib/erp-core/events/event-taxonomy";

type Db = SupabaseClient<Database>;

const DEFAULT_WORKFLOW_STEPS = [
  { step_key: "intake", step_order: 0, label: "Prise en charge" },
  { step_key: "execution", step_order: 1, label: "Exécution" },
  { step_key: "review", step_order: 2, label: "Revue" },
  { step_key: "closure", step_order: 3, label: "Clôture" },
] as const;

function refCode(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

async function recordTaskHistory(
  supabase: Db,
  params: {
    taskId: string;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
    changedBy: string;
  },
): Promise<void> {
  const { error } = await supabase.from("erp_ops_task_history").insert({
    task_id: params.taskId,
    field_name: params.fieldName,
    old_value: params.oldValue,
    new_value: params.newValue,
    changed_by: params.changedBy,
  });
  if (error) console.warn("[ops-task-history]", error.message);
}

async function seedWorkflowSteps(supabase: Db, workflowId: string): Promise<void> {
  const rows = DEFAULT_WORKFLOW_STEPS.map((s) => ({
    workflow_id: workflowId,
    step_key: s.step_key,
    step_order: s.step_order,
    label: s.label,
    status: (s.step_key === "intake" ? "active" : "pending") as "pending" | "active",
  }));
  const { error } = await supabase.from("erp_ops_workflow_steps").insert(rows);
  if (error) throw new Error(error.message);
}

// ─── Projects ───

export type CreateOpsProjectInput = {
  title: string;
  description?: string | null;
  ownerUserId: string;
  budgetReference?: string | null;
  teamMembers?: string[];
};

export async function createOpsProject(userId: string, input: CreateOpsProjectInput) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.PROJECT_CREATE, "create");

  const title = input.title.trim();
  if (!title) throw new Error("Le titre du projet est obligatoire.");

  const supabase = getSupabaseServerClient();
  const projectCode = refCode("PRJ");

  const { data, error } = await supabase
    .from("erp_ops_projects")
    .insert({
      project_code: projectCode,
      title,
      description: input.description?.trim() || null,
      owner_user_id: input.ownerUserId,
      status: "active",
      budget_reference: input.budgetReference?.trim() || null,
      team_members: input.teamMembers ?? [],
      created_by: userId,
    })
    .select("id,project_code,title,owner_user_id,status")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitOpsProjectCreated({
      actorUserId: userId,
      projectId: data.id,
      projectCode: data.project_code,
      title: data.title,
      ownerUserId: data.owner_user_id,
    }),
    recordOpsGovernanceAudit({
      actionType: OPS_WRITE_ACTIONS.PROJECT_CREATE,
      entityType: "erp_ops_projects",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function updateOpsProjectStatus(
  userId: string,
  projectId: string,
  status: "draft" | "active" | "on_hold" | "completed" | "archived",
) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.PROJECT_UPDATE, "update");

  const supabase = getSupabaseServerClient();
  const { data: before } = await supabase
    .from("erp_ops_projects")
    .select("id,status")
    .eq("id", projectId)
    .single();

  const { data, error } = await supabase
    .from("erp_ops_projects")
    .update({ status })
    .eq("id", projectId)
    .select("id,project_code,title,status")
    .single();

  if (error) throw new Error(error.message);

  await recordOpsGovernanceAudit({
    actionType: OPS_WRITE_ACTIONS.PROJECT_UPDATE,
    entityType: "erp_ops_projects",
    entityId: data.id,
    beforeSnapshot: before,
    afterSnapshot: data,
  });

  return data;
}

// ─── Tasks ───

export type CreateOpsTaskInput = {
  title: string;
  description?: string | null;
  projectId?: string | null;
  ownerUserId: string;
  assigneeUserId?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  dueAt?: string | null;
  dependsOnTaskId?: string | null;
  sourceEventType?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
};

export async function createOpsTask(userId: string, input: CreateOpsTaskInput) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.TASK_CREATE, "create");

  const title = input.title.trim();
  if (!title) throw new Error("Le titre de la tâche est obligatoire.");

  const supabase = getSupabaseServerClient();
  const taskCode = refCode("TSK");

  const { data, error } = await supabase
    .from("erp_ops_tasks")
    .insert({
      task_code: taskCode,
      title,
      description: input.description?.trim() || null,
      project_id: input.projectId ?? null,
      owner_user_id: input.ownerUserId,
      assignee_user_id: input.assigneeUserId ?? null,
      priority: input.priority ?? "normal",
      due_at: input.dueAt ?? null,
      depends_on_task_id: input.dependsOnTaskId ?? null,
      source_event_type: input.sourceEventType ?? null,
      source_entity_type: input.sourceEntityType ?? null,
      source_entity_id: input.sourceEntityId ?? null,
      created_by: userId,
    })
    .select("id,task_code,title,status,assignee_user_id,project_id")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitOpsTaskCreated({
      actorUserId: userId,
      taskId: data.id,
      taskCode: data.task_code,
      title: data.title,
      projectId: data.project_id,
    }),
    recordOpsGovernanceAudit({
      actionType: OPS_WRITE_ACTIONS.TASK_CREATE,
      entityType: "erp_ops_tasks",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  if (input.assigneeUserId) {
    await emitOpsTaskAssigned({
      actorUserId: userId,
      taskId: data.id,
      assigneeUserId: input.assigneeUserId,
    });
  }

  return data;
}

export async function assignOpsTask(userId: string, taskId: string, assigneeUserId: string) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.TASK_ASSIGN, "update");

  const supabase = getSupabaseServerClient();
  const { data: before } = await supabase
    .from("erp_ops_tasks")
    .select("assignee_user_id")
    .eq("id", taskId)
    .single();

  const { data, error } = await supabase
    .from("erp_ops_tasks")
    .update({ assignee_user_id: assigneeUserId, status: "in_progress" })
    .eq("id", taskId)
    .select("id,task_code,assignee_user_id,status")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitOpsTaskAssigned({ actorUserId: userId, taskId: data.id, assigneeUserId }),
    recordTaskHistory(supabase, {
      taskId,
      fieldName: "assignee_user_id",
      oldValue: before?.assignee_user_id ?? null,
      newValue: assigneeUserId,
      changedBy: userId,
    }),
    recordOpsGovernanceAudit({
      actionType: OPS_WRITE_ACTIONS.TASK_ASSIGN,
      entityType: "erp_ops_tasks",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function updateOpsTaskStatus(
  userId: string,
  taskId: string,
  status: "todo" | "in_progress" | "blocked" | "done" | "cancelled",
) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.TASK_UPDATE, "update");

  const supabase = getSupabaseServerClient();
  const { data: before } = await supabase
    .from("erp_ops_tasks")
    .select("status,task_code")
    .eq("id", taskId)
    .single();

  const { data, error } = await supabase
    .from("erp_ops_tasks")
    .update({ status })
    .eq("id", taskId)
    .select("id,task_code,status")
    .single();

  if (error) throw new Error(error.message);

  await recordTaskHistory(supabase, {
    taskId,
    fieldName: "status",
    oldValue: before?.status ?? null,
    newValue: status,
    changedBy: userId,
  });

  if (status === "done" && before?.status !== "done") {
    await completeOpsTask(userId, taskId);
    return data;
  }

  await recordOpsGovernanceAudit({
    actionType: OPS_WRITE_ACTIONS.TASK_UPDATE,
    entityType: "erp_ops_tasks",
    entityId: data.id,
    afterSnapshot: data,
  });

  return data;
}

export async function completeOpsTask(userId: string, taskId: string) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.TASK_COMPLETE, "update");

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("erp_ops_tasks")
    .update({
      status: "done",
      completed_at: now,
      completed_by: userId,
    })
    .eq("id", taskId)
    .select("id,task_code,status,completed_at")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitOpsTaskCompleted({
      actorUserId: userId,
      taskId: data.id,
      taskCode: data.task_code,
    }),
    recordOpsGovernanceAudit({
      actionType: OPS_WRITE_ACTIONS.TASK_COMPLETE,
      entityType: "erp_ops_tasks",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

// ─── Workflows ───

export async function startOpsWorkflow(
  userId: string,
  input: {
    subjectType: "project" | "task" | "delivery";
    subjectId: string;
    ownerUserId: string;
  },
) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.WORKFLOW_START, "create");

  const supabase = getSupabaseServerClient();
  const workflowCode = refCode("WFL");

  const { data, error } = await supabase
    .from("erp_ops_workflows")
    .insert({
      workflow_code: workflowCode,
      subject_type: input.subjectType,
      subject_id: input.subjectId,
      status: "active",
      current_step_key: "intake",
      owner_user_id: input.ownerUserId,
      created_by: userId,
    })
    .select("id,workflow_code,subject_type,status")
    .single();

  if (error) throw new Error(error.message);

  await seedWorkflowSteps(supabase, data.id);

  await Promise.all([
    emitOpsWorkflowStarted({
      actorUserId: userId,
      workflowId: data.id,
      workflowCode: data.workflow_code,
      subjectType: data.subject_type,
    }),
    recordOpsGovernanceAudit({
      actionType: OPS_WRITE_ACTIONS.WORKFLOW_START,
      entityType: "erp_ops_workflows",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function transitionOpsWorkflow(
  userId: string,
  workflowId: string,
  targetStatus: "pending" | "active" | "review" | "approved" | "closed",
) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.WORKFLOW_TRANSITION, "update");

  const supabase = getSupabaseServerClient();
  const { data: before } = await supabase
    .from("erp_ops_workflows")
    .select("id,workflow_code,status")
    .eq("id", workflowId)
    .single();

  const stepKey =
    targetStatus === "review"
      ? "review"
      : targetStatus === "approved"
        ? "closure"
        : targetStatus === "active"
          ? "execution"
          : "intake";

  const { data, error } = await supabase
    .from("erp_ops_workflows")
    .update({ status: targetStatus, current_step_key: stepKey })
    .eq("id", workflowId)
    .select("id,workflow_code,status")
    .single();

  if (error) throw new Error(error.message);

  if (targetStatus === "approved" && before?.status !== "approved") {
    await emitOpsWorkflowApproved({
      actorUserId: userId,
      workflowId: data.id,
      workflowCode: data.workflow_code,
    });
  }

  await recordOpsGovernanceAudit({
    actionType: OPS_WRITE_ACTIONS.WORKFLOW_TRANSITION,
    entityType: "erp_ops_workflows",
    entityId: data.id,
    beforeSnapshot: before,
    afterSnapshot: data,
  });

  return data;
}

// ─── Delivery ───

export async function createOpsDelivery(
  userId: string,
  input: {
    projectId: string;
    milestoneKey: string;
    milestoneLabel: string;
    dueAt?: string | null;
  },
) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.DELIVERY_CREATE, "create");

  const supabase = getSupabaseServerClient();
  const deliveryCode = refCode("DLV");

  const { data, error } = await supabase
    .from("erp_ops_deliveries")
    .insert({
      delivery_code: deliveryCode,
      project_id: input.projectId,
      milestone_key: input.milestoneKey,
      milestone_label: input.milestoneLabel,
      due_at: input.dueAt ?? null,
      created_by: userId,
    })
    .select("id,delivery_code,project_id,milestone_key,status")
    .single();

  if (error) throw new Error(error.message);

  await recordOpsGovernanceAudit({
    actionType: OPS_WRITE_ACTIONS.DELIVERY_CREATE,
    entityType: "erp_ops_deliveries",
    entityId: data.id,
    afterSnapshot: data,
  });

  return data;
}

export async function updateOpsDeliveryProgress(
  userId: string,
  deliveryId: string,
  progressPct: number,
) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.DELIVERY_UPDATE, "update");

  const supabase = getSupabaseServerClient();
  const status = progressPct >= 100 ? "completed" : progressPct > 0 ? "in_progress" : "planned";

  const { data, error } = await supabase
    .from("erp_ops_deliveries")
    .update({
      progress_pct: Math.min(100, Math.max(0, progressPct)),
      status,
      executed_by: userId,
    })
    .eq("id", deliveryId)
    .select("id,project_id,milestone_key,progress_pct,status")
    .single();

  if (error) throw new Error(error.message);

  if (status === "completed") {
    await completeOpsDelivery(userId, deliveryId);
  }

  return data;
}

export async function completeOpsDelivery(userId: string, deliveryId: string) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.DELIVERY_COMPLETE, "update");

  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("erp_ops_deliveries")
    .update({
      status: "completed",
      progress_pct: 100,
      completed_at: now,
      executed_by: userId,
    })
    .eq("id", deliveryId)
    .select("id,project_id,milestone_key,status")
    .single();

  if (error) throw new Error(error.message);

  await Promise.all([
    emitOpsDeliveryCompleted({
      actorUserId: userId,
      deliveryId: data.id,
      projectId: data.project_id,
      milestoneKey: data.milestone_key,
    }),
    recordOpsGovernanceAudit({
      actionType: OPS_WRITE_ACTIONS.DELIVERY_COMPLETE,
      entityType: "erp_ops_deliveries",
      entityId: data.id,
      afterSnapshot: data,
    }),
  ]);

  return data;
}

export async function reportOpsDeliveryDelay(
  userId: string,
  deliveryId: string,
  delayReason: string,
) {
  await assertOpsWriteActionAllowed(userId, OPS_WRITE_ACTIONS.DELIVERY_UPDATE, "update");

  const reason = delayReason.trim();
  if (!reason) throw new Error("Le motif de retard est obligatoire.");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("erp_ops_deliveries")
    .update({ status: "delayed", delay_reason: reason })
    .eq("id", deliveryId)
    .select("id,project_id,delay_reason,status")
    .single();

  if (error) throw new Error(error.message);

  await emitOpsExecutionDelayed({
    actorUserId: userId,
    deliveryId: data.id,
    projectId: data.project_id,
    delayReason: reason,
  });

  return data;
}

// ─── Orchestration (cross-domain, idempotent par source) ───

export async function orchestrateOpsTaskFromDealWon(params: {
  actorUserId: string;
  opportunityId: string;
  amountGnf: number;
}): Promise<{ created: boolean; taskId?: string }> {
  const supabase = getSupabaseServerClient();

  const { data: existing } = await supabase
    .from("erp_ops_tasks")
    .select("id")
    .eq("source_event_type", OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_WON)
    .eq("source_entity_id", params.opportunityId)
    .maybeSingle();

  if (existing?.id) return { created: false, taskId: existing.id };

  const row = await createOpsTask(params.actorUserId, {
    title: `Suivi deal gagné — ${params.opportunityId.slice(0, 8)}`,
    description: `Montant estimé : ${params.amountGnf} GNF. Orchestration CRM → Operations.`,
    ownerUserId: params.actorUserId,
    assigneeUserId: params.actorUserId,
    priority: "high",
    sourceEventType: OFFICIAL_ERP_EVENT_TYPES.CRM_DEAL_WON,
    sourceEntityType: "crm_opportunities",
    sourceEntityId: params.opportunityId,
  });

  return { created: true, taskId: row.id };
}

export async function orchestrateOpsDeliveryFromInventoryReceived(params: {
  actorUserId: string;
  receiptId: string;
  totalQty: number;
}): Promise<{ created: boolean; deliveryId?: string }> {
  const supabase = getSupabaseServerClient();

  const { data: existingProject } = await supabase
    .from("erp_ops_projects")
    .select("id")
    .eq("budget_reference", params.receiptId)
    .maybeSingle();

  let projectId = existingProject?.id;
  if (!projectId) {
    const project = await createOpsProject(params.actorUserId, {
      title: `Exécution réception — ${params.receiptId.slice(0, 8)}`,
      ownerUserId: params.actorUserId,
      budgetReference: params.receiptId,
    });
    projectId = project.id;
    await startOpsWorkflow(params.actorUserId, {
      subjectType: "project",
      subjectId: projectId,
      ownerUserId: params.actorUserId,
    });
  }

  const delivery = await createOpsDelivery(params.actorUserId, {
    projectId,
    milestoneKey: "inventory_received",
    milestoneLabel: `Réception stock (${params.totalQty} u.)`,
  });

  await updateOpsDeliveryProgress(params.actorUserId, delivery.id, 50);

  return { created: true, deliveryId: delivery.id };
}

export async function orchestrateOpsWorkflowFromApprovalApproved(params: {
  actorUserId: string;
  approvalRequestId: string;
}): Promise<{ advanced: boolean }> {
  const supabase = getSupabaseServerClient();

  const { data: workflow } = await supabase
    .from("erp_ops_workflows")
    .select("id,status")
    .eq("approval_request_id", params.approvalRequestId)
    .in("status", ["pending", "active", "review"])
    .maybeSingle();

  if (!workflow?.id) return { advanced: false };

  await transitionOpsWorkflow(params.actorUserId, workflow.id, "approved");
  return { advanced: true };
}
