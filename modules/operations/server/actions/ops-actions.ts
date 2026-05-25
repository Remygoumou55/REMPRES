"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidateOperations } from "@/lib/cache/revalidation-map";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import {
  assignOpsTask,
  completeOpsTask,
  createOpsDelivery,
  createOpsProject,
  createOpsTask,
  reportOpsDeliveryDelay,
  startOpsWorkflow,
  transitionOpsWorkflow,
  updateOpsDeliveryProgress,
  updateOpsProjectStatus,
  updateOpsTaskStatus,
} from "@/modules/operations/server/services/ops-mutations";
import { generateOpsOperationalReport } from "@/modules/operations/server/services/ops-analytics-service";

function mapOpsError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message.startsWith("ops:")) return "Action operations refusée par la gouvernance.";
    return e.message;
  }
  return "Erreur operations inattendue.";
}

async function requireUserId(): Promise<string | SafeResult<never>> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) redirect("/login");
  return data.user.id;
}

function afterOpsMutation() {
  void revalidateOperations();
}

export async function createOpsProjectAction(input: {
  title: string;
  description?: string;
  ownerUserId: string;
  budgetReference?: string;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createOpsProject(userId, input);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function createOpsTaskAction(input: {
  title: string;
  description?: string;
  projectId?: string;
  ownerUserId: string;
  assigneeUserId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  dueAt?: string;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createOpsTask(userId, input);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function assignOpsTaskAction(
  taskId: string,
  assigneeUserId: string,
): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await assignOpsTask(userId, taskId, assigneeUserId);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function completeOpsTaskAction(taskId: string): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await completeOpsTask(userId, taskId);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function updateOpsTaskStatusAction(
  taskId: string,
  status: "todo" | "in_progress" | "blocked" | "done" | "cancelled",
): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await updateOpsTaskStatus(userId, taskId, status);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function startOpsWorkflowAction(input: {
  subjectType: "project" | "task" | "delivery";
  subjectId: string;
  ownerUserId: string;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await startOpsWorkflow(userId, input);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function transitionOpsWorkflowAction(
  workflowId: string,
  targetStatus: "pending" | "active" | "review" | "approved" | "closed",
): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await transitionOpsWorkflow(userId, workflowId, targetStatus);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function createOpsDeliveryAction(input: {
  projectId: string;
  milestoneKey: string;
  milestoneLabel: string;
  dueAt?: string;
}): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await createOpsDelivery(userId, input);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function updateOpsDeliveryProgressAction(
  deliveryId: string,
  progressPct: number,
): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await updateOpsDeliveryProgress(userId, deliveryId, progressPct);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function reportOpsDeliveryDelayAction(
  deliveryId: string,
  delayReason: string,
): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await reportOpsDeliveryDelay(userId, deliveryId, delayReason);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function updateOpsProjectStatusAction(
  projectId: string,
  status: "draft" | "active" | "on_hold" | "completed" | "archived",
): Promise<SafeResult<{ id: string }>> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const row = await updateOpsProjectStatus(userId, projectId, status);
    afterOpsMutation();
    return ok({ id: row.id });
  } catch (e) {
    return err(mapOpsError(e));
  }
}

export async function generateOpsReportAction(): Promise<
  SafeResult<{ reportId: string }>
> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;
  try {
    const analytics = await generateOpsOperationalReport(userId);
    afterOpsMutation();
    return ok({ reportId: analytics.reportId });
  } catch (e) {
    return err(mapOpsError(e));
  }
}
