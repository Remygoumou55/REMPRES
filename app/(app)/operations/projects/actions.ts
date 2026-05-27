"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  createOpsProject,
  deleteOpsProject,
  updateOpsProject,
} from "@/lib/server/operations";
import type { OpsProjectStatus } from "@/lib/constants/operations";

function parseProjectStatus(raw: string): OpsProjectStatus {
  const v = raw as OpsProjectStatus;
  if (
    v === "draft" ||
    v === "active" ||
    v === "on_hold" ||
    v === "completed" ||
    v === "archived"
  ) {
    return v;
  }
  return "active";
}

function parseBudget(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/\s/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function createProjectAction(
  formData: FormData,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { success: false, error: "Le nom est requis." };

  const managerId =
    String(formData.get("manager_id") ?? "").trim() || user.id;

  const result = await createOpsProject({
    name,
    description: String(formData.get("description") ?? "").trim() || undefined,
    status: parseProjectStatus(String(formData.get("status") ?? "active")),
    start_date: String(formData.get("start_date") ?? "").trim() || null,
    end_date: String(formData.get("end_date") ?? "").trim() || null,
    manager_id: managerId === "none" ? user.id : managerId,
    budget_gnf: parseBudget(String(formData.get("budget_gnf") ?? "")),
    budget_reference:
      String(formData.get("budget_reference") ?? "").trim() || undefined,
    created_by: user.id,
  });

  if (result.success) {
    revalidatePath("/operations/projects");
    revalidatePath("/operations/tasks");
    revalidatePath("/operations/dashboard");
  }

  return result;
}

export async function updateProjectAction(
  projectId: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await updateOpsProject(projectId, user.id, {
    name: String(formData.get("name") ?? "").trim(),
    description:
      String(formData.get("description") ?? "").trim() || undefined,
    status: parseProjectStatus(String(formData.get("status") ?? "active")),
    start_date: String(formData.get("start_date") ?? "").trim() || null,
    end_date: String(formData.get("end_date") ?? "").trim() || null,
    manager_id:
      String(formData.get("manager_id") ?? "").trim() || null,
    budget_gnf: parseBudget(String(formData.get("budget_gnf") ?? "")),
    budget_reference:
      String(formData.get("budget_reference") ?? "").trim() || undefined,
  });

  if (result.success) {
    revalidatePath("/operations/projects");
    revalidatePath("/operations/tasks");
  }

  return result;
}

export async function deleteProjectAction(
  projectId: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await deleteOpsProject(projectId, user.id);
  if (result.success) {
    revalidatePath("/operations/projects");
    revalidatePath("/operations/tasks");
  }
  return result;
}
