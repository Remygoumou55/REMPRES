"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { executeRulesForTrigger } from "@/lib/server/automation-executor";
import { createNotification } from "@/lib/server/notifications";
import {
  createOpsTask,
  deleteOpsTask,
  getOpsTask,
  updateOpsTask,
  updateOpsTaskStatus,
} from "@/lib/server/operations";
import type { OpsTaskPriority, OpsTaskStatus } from "@/lib/constants/operations";

function parseStatus(raw: string): OpsTaskStatus {
  const v = raw as OpsTaskStatus;
  if (
    v === "todo" ||
    v === "in_progress" ||
    v === "blocked" ||
    v === "done" ||
    v === "cancelled"
  ) {
    return v;
  }
  return "todo";
}

function parsePriority(raw: string): OpsTaskPriority {
  const v = raw as OpsTaskPriority;
  if (v === "low" || v === "normal" || v === "high" || v === "urgent") {
    return v;
  }
  return "normal";
}

/** Notification envoyée à l'assigné via createNotification() — T-OPS1 */
async function notifyAssignee(
  assigneeId: string | null | undefined,
  title: string,
) {
  if (!assigneeId?.trim()) return;
  try {
    await createNotification({
      userId: assigneeId,
      type: "info",
      title: "Tâche assignée",
      message: `Vous avez été assigné à la tâche « ${title} ».`,
      actionUrl: "/operations/tasks",
    });
  } catch {
    // Non bloquant — l'échec de notification ne doit pas casser la tâche
  }
}

export async function createTaskAction(
  formData: FormData,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { success: false, error: "Le titre est requis." };

  const assignedTo = String(formData.get("assigned_to") ?? "").trim() || null;
  const projectId = String(formData.get("project_id") ?? "").trim() || null;
  const dueRaw = String(formData.get("due_date") ?? "").trim();

  const result = await createOpsTask({
    title,
    description: String(formData.get("description") ?? "").trim() || undefined,
    status: parseStatus(String(formData.get("status") ?? "todo")),
    priority: parsePriority(String(formData.get("priority") ?? "normal")),
    due_date: dueRaw || null,
    project_id: projectId === "none" ? null : projectId,
    assigned_to: assignedTo === "none" ? null : assignedTo,
    created_by: user.id,
  });

  if (result.success) {
    await notifyAssignee(assignedTo, title);
    revalidatePath("/operations/tasks");
    revalidatePath("/operations/projects");
    revalidatePath("/operations/dashboard");
  }

  return result;
}

export async function updateTaskAction(
  taskId: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const title = String(formData.get("title") ?? "").trim();
  const assignedTo = String(formData.get("assigned_to") ?? "").trim() || null;
  const projectId = String(formData.get("project_id") ?? "").trim() || null;
  const dueRaw = String(formData.get("due_date") ?? "").trim();

  const previous = await getOpsTask(taskId);
  const newAssignee = assignedTo === "none" ? null : assignedTo;

  const result = await updateOpsTask(taskId, user.id, {
    title,
    description:
      String(formData.get("description") ?? "").trim() || undefined,
    status: parseStatus(String(formData.get("status") ?? "todo")),
    priority: parsePriority(String(formData.get("priority") ?? "normal")),
    due_date: dueRaw || null,
    project_id: projectId === "none" ? null : projectId,
    assigned_to: newAssignee,
  });

  if (result.success) {
    if (newAssignee && newAssignee !== previous?.assigned_to) {
      await notifyAssignee(newAssignee, title);
    }
    revalidatePath("/operations/tasks");
    revalidatePath("/operations/projects");
  }

  return result;
}

export async function updateTaskStatusAction(
  taskId: string,
  newStatus: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await updateOpsTaskStatus(
    taskId,
    user.id,
    parseStatus(newStatus),
  );

  if (result.success) {
    const status = parseStatus(newStatus);
    if (status === "in_progress" || status === "blocked") {
      executeRulesForTrigger("task_overdue", {
        entity_id: taskId,
        priority: "normal",
        department: "operations",
        user_id: user.id,
      }).catch(() => {});
    }
    revalidatePath("/operations/tasks");
    revalidatePath("/operations/dashboard");
  }

  return result;
}

export async function deleteTaskAction(
  taskId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await deleteOpsTask(taskId, user.id);
  if (result.success) {
    revalidatePath("/operations/tasks");
    revalidatePath("/operations/projects");
  }
  return result;
}
